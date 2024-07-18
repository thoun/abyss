<?php

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */

    function explore(bool $fromRequest = true ) {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        if ($fromRequest) {
            $this->checkAction( 'explore' );
        }

        $playerId = $this->getActivePlayerId();
        $slots = Ally::getExploreSlots();

        // If the row is full, you can't explore.
        // You have to pick the last card.
        if (count($slots) == 5) {
            // Error!
            throw new BgaUserException( $this->_("There are already 5 Allies on the explore track. You must take the last one.") );
        }

        if (Ally::getDeckSize() == 0) {
            // TODO : Shuffle cards from the dicard back in
            // Error!
            throw new BgaUserException( $this->_("There are no cards left in the deck.") );
        }

        if (count($slots) > 0) {
            $ally = end($slots);
            if ($ally["faction"] === null && $this->checkAction( 'exploreTake', false )) {
                $leviathanExpansion = $this->isLeviathanExpansion();

                if ($leviathanExpansion) {
                    $redirected = $this->drawNewLeviathanAndRollDice($playerId, ST_PLAYER_EXPLORE);

                    if ($redirected) {
                        return; // stop here because the player first needs to discard monsters
                    }

                    // discard the monster
                    Ally::discard($ally["ally_id"]);
                    $this->notifyAllPlayers("discardExploreMonster", clienttranslate('${player_name} discards the Monster'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getActivePlayerName(),
                        'ally' => $ally,
                        'allyDiscardSize' => Ally::getDiscardSize(),
                    ]);
                } else if ($this->getGameStateValue( 'threat_level' ) < 5) {
                    // Increase the threat track
                    $threat = intval($this->incGameStateValue('threat_level', 1));
                    $this->notifyAllPlayers("setThreat", '', [
                        'threat' => $threat,
                    ]);
                }
            }
        }

        $this->endExplore($playerId);
    }

    function endExplore(int $playerId) {

        // Remember whose turn to return to if a player purchases the ally
        $this->setGameStateValue( 'first_player_id', $playerId );

        // Add your game logic to explore here
        // Reveal the top card of the explore deck, and tell everyone about it
        $ally = Ally::draw();
        
        if ($ally['faction'] !== NULL) {
            $log = clienttranslate('${player_name} reveals ${card_name}');
            $card_name = array(
                'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                'args' => array(
                    'value' => $ally["value"],
                    'faction' => $this->factions[$ally["faction"]]["ally_name"],
                    'i18n' => ['faction']
                )
            );
        } else {
            $log = clienttranslate('${player_name} reveals a Monster');
            $card_name = '';
        }
        // Notify all players about the card revealed
        $this->notifyAllPlayers( "explore", $log, array(
            'player_id' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'ally' => $ally,
            'deck_size' => Ally::getDeckSize(),
            'card_name' => $card_name
        ) );

        // Go to other players to see if they want to buy the card...
        $this->gamestate->jumpToState(ST_PRE_PURCHASE);
    }

    function drawNewLeviathanAndRollDice(int $playerId, int $nextState): bool { // redirected
        $newLeviathan = LeviathanManager::draw(99); // temp space
        $newLeviathan->place = 99;
        $this->notifyAllPlayers("newLeviathan", clienttranslate('${player_name} draws a new Leviathan'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'leviathan' => clone $newLeviathan,
        ]);

        $dice = $this->getDoubleDieRoll();
        $sum = $dice[0] + $dice[1];
        $spot = LEVIATHAN_SLOTS[$sum];

        $this->notifyAllPlayers("rollDice", clienttranslate('${player_name} rolls the dice and obtains ${die1} and ${die2}, the new Leviathan will be placed on the spot ${spot}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'dice' => $dice,
            'die1' => $dice[0],
            'die2' => $dice[1],
            'spot' => $spot,
        ]);
        $this->globals->set(LAST_DIE_ROLL, [$spot, $dice]);

        $existingLeviathan = LeviathanManager::getLeviathanAtSlot($spot);

        if ($existingLeviathan !== null) {
            $needChooseDamage = $this->applyExistingLeviathanDamage($playerId, $existingLeviathan);

            if ($needChooseDamage) {
                $this->globals->set(PLAYER_LEVIATHAN_DAMAGE, [$playerId, $spot, $nextState]);
                $this->gamestate->jumpToState(ST_MULTIPLAYER_APPLY_LEVIATHAN_DAMAGE);
                return true;
            }

            // discard the Leviathan
            LeviathanManager::discard($existingLeviathan->id, 1);
        }
        $this->moveNewLeviathanAfterLeviathanDamage($spot, $newLeviathan, $existingLeviathan);

        return false;
    }

    function moveNewLeviathanAfterLeviathanDamage(int $spot, Leviathan $newLeviathan, ?Leviathan $existingLeviathan) {
        if ($existingLeviathan !== null) {
            // discard the Leviathan
            LeviathanManager::discard($existingLeviathan->id, 1);

            $this->notifyAllPlayers("discardLeviathan", clienttranslate('The attacking Leviathan is discarded'), [
                'leviathan' => $existingLeviathan,
            ]);
        }

        $newLeviathan->place = $spot;
        Abyss::DbQuery("UPDATE leviathan SET place = $spot WHERE place = 99");

        $this->notifyAllPlayers("newLeviathan", clienttranslate('The new Leviathan takes place on the spot ${spot}'), [
            'spot' => $spot,
            'leviathan' => $newLeviathan,
        ]);
    }

    function applyExistingLeviathanDamage(int $playerId, Leviathan $existingLeviathan): bool { // indicates if the player needs to select allies / lords to discard
        // take damage!
        switch ($existingLeviathan->penalty) {
            case PENALTY_WOUNDS:
                $this->notifyAllPlayers( "log", clienttranslate('${player_name} takes ${number} wound(s) with the attack of the already present Leviathan'), [
                    'player_id' => $playerId,
                    'player_name' => $this->getPlayerNameById($playerId),
                    'number' => $existingLeviathan->penaltyCount,
                ]);

                $this->incPlayerWounds($playerId, $existingLeviathan->penaltyCount);
                break;
            case PENALTY_PEARLS:
                $canLoose = min($existingLeviathan->penaltyCount, $this->getPlayerPearls($playerId));
                if ($canLoose) {
                    $this->notifyAllPlayers( "log", clienttranslate('${player_name} loses ${number} pearl(s) with the attack of the already present Leviathan'), [
                        'player_id' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                        'number' => $canLoose,
                    ]);
    
                    $this->incPlayerPearls($playerId, -$canLoose, '');
                } else {
                    $this->notifyAllPlayers( "log", clienttranslate('attack of the already present Leviathan has no effect on ${player_name}'), [
                        'player_id' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                    ]);
                }
                break;
            case PENALTY_ALLIES:
                $allies = Ally::getPlayerHand($playerId);
                if (count($allies) > $existingLeviathan->penaltyCount) {
                    // let select the $existingLeviathan->penaltyCount allies to discard
                    $this->notifyAllPlayers( "log", clienttranslate('${player_name} loses ${number} Allies with the attack of the already present Leviathan'), [
                        'player_id' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                        'number' => $existingLeviathan->penaltyCount,
                    ]);
                    return true;
                } else if (count($allies) > 0) {
                    // discard all hand
                    $this->notifyAllPlayers( "log", clienttranslate('${player_name} loses ${number} Allies with the attack of the already present Leviathan'), [
                        'player_id' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                        'number' => count($allies),
                    ]);

                    foreach ($allies as $ally) {
                        Ally::discard( $ally['ally_id'] );

                        if ($ally['faction'] === 10) {
                            $this->incPlayerNebulis($playerId, $ally['value'] - 1, "fight-leviathan-discard-ally");
                        }
                    }

                    $this->notifyAllPlayers( "diff", '', array(
                        'player_id' => $playerId,
                        'allies_lost' => $allies,
                        'source' => "player_$playerId",
                        'allyDiscardSize' => Ally::getDiscardSize(),
                    ) );
                } else {
                    $this->notifyAllPlayers( "log", clienttranslate('attack of the already present Leviathan has no effect on ${player_name}'), [
                        'player_id' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                    ]);
                }
                break;
            case PENALTY_LORD:
                $lords = Lord::getPlayerHand($playerId);
                $freeLords = array_values(array_filter($lords, fn($lord) => $lord['location'] === null));
                if (count($freeLords) > $existingLeviathan->penaltyCount) {
                    // let select the free lord (always 1) to discard
                    $this->notifyAllPlayers( "log", clienttranslate('${player_name} loses ${number} free Lord with the attack of the already present Leviathan'), [
                        'player_id' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                        'number' => $existingLeviathan->penaltyCount,
                    ]);

                    return true;
                } else if (count($freeLords) > 0) {
                    // discard all freeLords
                    foreach ($freeLords as $lord) {
                        Lord::discard( $lord['lord_id'] );
                    }

                    $this->notifyAllPlayers( "log", clienttranslate('${player_name} loses ${number} free Lord with the attack of the already present Leviathan'), [
                        'player_id' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                        'number' => count($freeLords),
                    ]);

                    $this->notifyAllPlayers( "discardLords", '', [
                        'lords' => $freeLords,
                        'playerId' => $playerId,
                    ]);
                } else {
                    $this->notifyAllPlayers( "log", clienttranslate('attack of the already present Leviathan has no effect on ${player_name}'), [
                        'player_id' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                    ]);
                }
                break;
        }
        return false;
    }
    
    function exploreTake(int $slot, bool $fromRequest = true ) {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        if ($fromRequest) {
            $this->checkAction( 'exploreTake' );
        }

        $player_id = intval($this->getActivePlayerId());

        // This must be the last ally in the track
        $slots = Ally::getExploreSlots();
        if ($slot != count($slots)) {
            throw new BgaUserException( $this->_("You can only take the last card in the explore track.") );
        }

        // If it's the last slot, you also gain a pearl
        if ($slot == 5) {
            $this->incPlayerPearls( $player_id, 1, "explore" );
        }

        $ally = end($slots);

        $nextState = "exploreTakeAlly";
        if ($ally['faction'] === NULL) {
            // If it's a monster, go through the monster rigmarole
            $leviathanExpansion = $this->isLeviathanExpansion();
            if ($leviathanExpansion) {
                if (count(LeviathanManager::canFightSome(Ally::getPlayerHand( $player_id ), $player_id)) > 0) {
                    $this->globals->set(SLAYED_LEVIATHANS, 0);
                    $nextState = "chooseLeviathanToFight";
                } else {
                    throw new BgaUserException( $this->_("You cannot fight any Leviathan present at the Border, you must continue your Exploration.") );
                }
            } else {
                $nextState = "exploreTakeMonster";
            }
        } else {
            // Otherwise, add it to your hand
            $this->DbQuery( "UPDATE ally SET place = ".($player_id * -1)." WHERE ally_id = " . $ally["ally_id"] );

            if (array_some($slots, fn($s) => $s["faction"] == 10 && $s['ally_id'] != $ally["ally_id"])) {
                $nextState = "exploreTakeAllyRemainingKrakens";
            }
        }

        // If you have the Ship Master, you gain extra Pearls
        if (Lord::playerHas( 8, $player_id )) {
            $factions = array();
            foreach ($slots as $s) {
                if ($s["ally_id"] == $ally["ally_id"]) continue;
                if ($s["faction"] === NULL || $s["faction"] == 10) continue;
                $factions[$s["faction"]] = 1;
            }
            if (count($factions) > 0) {
                $this->incPlayerPearls( $player_id, count($factions), "lord_8" );
            }
        }

        $emptyTrack = $ally['faction'] !== NULL || !$this->isLeviathanExpansion();
        if ($emptyTrack) {
            // Move each ally to the appropriate council stack and discard monster allies
            $this->DbQuery( "UPDATE ally SET place = 6 WHERE faction IS NOT NULL AND place >= 1 AND place <= 5 AND faction <> 10");
            $this->DbQuery( "UPDATE ally SET place = 10 WHERE faction IS NULL AND place >= 1");
        }

        // Notification
        if ($ally['faction'] !== NULL) {
            $this->notifyAllPlayers( "exploreTake", clienttranslate('${player_name} takes ${card_name}'), [
                'ally' => $ally,
                'slot' => $slot,
                'player_id' => $player_id,
                'player_name' => $this->getPlayerNameById($player_id),
                'card_name' => array(
                    'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                    'args' => array(
                        'value' => $ally["value"],
                        'faction' => $this->factions[$ally["faction"]]["ally_name"],
                        'i18n' => ['faction']
                    )
                ),
                'allyDiscardSize' => Ally::getDiscardSize(),
            ]);
        } else {
            $leviathanExpansion = $this->isLeviathanExpansion();
            $this->notifyAllPlayers( $emptyTrack ? "exploreTake" : "log", clienttranslate('${player_name} fights a Monster'), [
                'ally' => $ally,
                'slot' => $slot,
                'player_id' => $player_id,
                'player_name' => $this->getPlayerNameById($player_id),
                'allyDiscardSize' => Ally::getDiscardSize(),
            ]);
        }

        $this->gamestate->nextState($nextState);
    }
    
    function recruit(int $lord_id) {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        $this->checkAction( 'recruit' );

        $player_id = intval($this->getActivePlayerId());

        // Confirm the chosen lord is in the display...
        $lord = Lord::getInTrack($lord_id);
        if ($lord == null) {
            throw new BgaVisibleSystemException( "That Lord is not available." );
        }

        $krakenExpansion = $this->isKrakenExpansion();
        if ($krakenExpansion) {
            $guarded = $this->guardedBySentinel('lord', $lord_id);
            if ($guarded !== null) {
                if ($guarded->playerId == $player_id) {
                    $this->discardSentinel($guarded->lordId);
                } else {
                    throw new BgaVisibleSystemException( "That Lord is not available (reserved by a sentinel)." );
                } 
            }
        }

        $state = $this->gamestate->state();
        if ($state['name'] == 'lord21') {
            // If there are no lords in the deck, you can't do this...
            if (Lord::getDeckSize() == 0) {
                throw new BgaUserException( $this->_("There are no Lords left in the deck.") );
            }
            
            // Discard the Lord, and replace with a new one!
            $new_lord = Lord::putRandom( $lord["place"] );
            Lord::discard( $lord["lord_id"] );

            // Use Lord
            Lord::use( 21 );
            $this->notifyPlayer( $player_id, "useLord", '', array(
                    'lord_id' => 21
            ) );

            // Notify new Lord
            $this->notifyAllPlayers( "plot", clienttranslate('${player_name} replaces ${old_lord_name} with ${new_lord_name} using ${lord_name}'), array(
                    'lord' => $new_lord,
                    'old_lord' => $lord,
                    'player_id' => $player_id,
                    'player_name' => $this->getActivePlayerName(),
                    'playerPearls' => $this->getPlayerPearls($player_id),
                    'pearls' => 0,
                    'deck_size' => Lord::getDeckSize(),
                    'lord_name' => $this->lords[21]["name"],
                    'old_lord_name' => $this->lords[$lord["lord_id"]]["name"],
                    'new_lord_name' => $this->lords[$new_lord["lord_id"]]["name"],
                    "i18n" => array('lord_name', 'old_lord_name', 'new_lord_name'),
            ));

            $this->returnToPrevious();
            return;
        }

        // Confirm the player _can_ afford the lord
        $pearls = $this->getPlayerPearls( $player_id );
        
        if ($state['name'] == 'lord23b') {
            Lord::giveToPlayer( $lord_id, $player_id );
            $this->notifyAllPlayers( "recruit", clienttranslate('${player_name} recruits ${lord_name} using ${lord_name2}'), array(
                    'lord' => $lord,
                    'player_id' => $player_id,
                    'player_name' => $this->getActivePlayerName(),
                    "i18n" => array('lord_name', 'lord_name2'),
                    "lord_name" => $this->lords[$lord_id]["name"],
                    "lord_name2" => $this->lords[23]["name"],
                    'allyDiscardSize' => Ally::getDiscardSize(),
            ) );
        } else if ($state['name'] == 'lord22') {
            // You only need 5 pearls

            $pearlCost = min(5, $pearls);
            $nebulisCost = 0;
            $withNebulis = $this->getWithNebulis($player_id, 5) ?? [];
            foreach ($withNebulis as $nebulis => $canUse) {
                if ($canUse) {
                    $pearlCost = 5 - $nebulis;
                    $nebulisCost = $nebulis;
                }
            }


            if (($pearlCost + $nebulisCost) < 5)
                throw new BgaUserException( $this->_("You cannot afford that Lord.") );

            // Spend 5 pearls, and give the player the Lord straight away
            $this->DbQuery( "UPDATE player SET player_pearls = player_pearls - $pearlCost WHERE player_id = " . $player_id );
            if ($withNebulis) {
                $this->DbQuery( "UPDATE player SET player_nebulis = player_nebulis - $nebulisCost WHERE player_id = " . $player_id );
                $this->checkNewKrakenOwner();
            }
            Lord::giveToPlayer( $lord_id, $player_id );
            $message = $nebulisCost > 0 ? 
                clienttranslate('${player_name} recruits ${lord_name} with ${spent_pearls} Pearls and ${spent_nebulis} Nebulis') :
                clienttranslate('${player_name} recruits ${lord_name} with ${spent_pearls} Pearls');
            $this->notifyAllPlayers( "recruit", $message, array(
                    'lord' => $lord,
                    'spent_allies' => [],
                    'spent_pearls' => $pearlCost,
                    'spent_nebulis' => $nebulisCost,
                    'playerPearls' => $this->getPlayerPearls($player_id),
                    'playerNebulis' => $this->getPlayerNebulis($player_id),
                    'player_id' => $player_id,
                    'player_name' => $this->getActivePlayerName(),
                    "i18n" => array('lord_name'),
                    "lord_name" => $this->lords[$lord_id]["name"],
                    'allyDiscardSize' => Ally::getDiscardSize(),
            ) );
        } else {
            $playerId = $player_id;
            $hand = Ally::getPlayerHand($playerId);
            $nebulis = $krakenExpansion ? min(Lord::playerHas(102, $playerId) ? 2 : 1, $this->getPlayerNebulis($playerId)) : 0;
            $canAffordLord = $this->canAffordLord($playerId, $hand, $pearls, $nebulis, $lord);

            if (!$canAffordLord) {
                throw new BgaUserException( $this->_("You cannot afford that Lord.") );
            }
        }

        $this->setGameStateValue( 'selected_lord', $lord_id );

        $this->gamestate->nextState( "recruit" );
    }
    
    function affiliate(int $ally_id ) {
        $this->checkAction( 'affiliate' );

        $player_id = intval($this->getActivePlayerId());

        $allies = array_values(Ally::getJustSpent());
        $min = 9999;
        $found = null;
        foreach ($allies as $ally) {
            if ($ally["ally_id"] == $ally_id) {
                $found = $ally;
            }
            if ($ally['value'] < $min) {
                $min = $ally['value'];
            }
        }

        if (! isset($found)) {
            throw new BgaVisibleSystemException( "You cannot affiliate that Ally (it wasn't used to buy the Lord)." );
        }

        $lord_id = $this->getGameStateValue( 'selected_lord' );
        if (($lord_id == 20 || ! Lord::playerHas( 20 , $player_id )) && $found['value'] != $min) {
            throw new BgaVisibleSystemException( "You cannot affiliate that Ally (it does not have the lowest value)." );
        }

        if ($found['faction'] == 10) {
            throw new BgaVisibleSystemException( "You cannot affiliate a Kraken." );
        }

        Ally::affiliate( $player_id, $found["ally_id"]);

        // Notify all
        $this->notifyAllPlayers( "affiliate", clienttranslate('${player_name} affiliates ${card_name}'), array(
                'ally' => $found,
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'card_name' => array(
                    'log' => '<span style="color:'.$this->factions[$found["faction"]]["colour"].'">${value} ${faction}</span>',
                    'args' => array(
                        'value' => $found["value"],
                        'faction' => $this->factions[$found["faction"]]["ally_name"],
                        'i18n' => ['faction']
                    )
                ),
        ) );

        $this->updatePlayerScore( $player_id, false );

        // Next state: Deal with ONCE effect of the last lord...
        $this->gamestate->nextState( 'affiliate' );
    }
    
    function chooseReward(int $option ) {
        $this->checkAction( 'chooseReward' );

        $player_id = intval($this->getActivePlayerId());
        $rewards = $this->argChooseMonsterReward()['rewards'];

        if ($option >= count($rewards) || $option < 0)
            throw new BgaVisibleSystemException( "Invalid reward choice ($option out of ".count($rewards).")." );

        // Give the player this option
        $reward_bits = str_split($rewards[$option]);
        $pearls = 0;
        $keys = 0;
        $monsters = array();
        $message = "";
        foreach ($reward_bits as $r) {
            if ($r == "M") {
                // Draw a monster tile!!!
                $monster = Monster::draw( $player_id );
                if (isset($monster)) {
                    $monsters[] = $monster;
                    $message .= '<i class="icon icon-monster"></i>';
                }
            } else if ($r == "P") {
                $pearls++;
                $message .= '<i class="icon icon-pearl"></i>';
            } else if ($r == "K") {
                $keys++;
                $message .= '<i class="icon icon-key"></i>';
            }
        }

        if (($keys + $pearls) > 0) {
            $this->DbQuery( "UPDATE player SET player_pearls = player_pearls + $pearls, player_keys = player_keys + $keys WHERE player_id = " . $player_id );
            $this->applyHighwayman($player_id, $pearls);
        }

        // Move the threat back to 0
        $this->setGameStateValue( 'threat_level', 0 );

        $this->notifyAllPlayers( "monsterReward", clienttranslate('${player_name} earns ${rewards} for defeating a Monster'), array(
                'keys' => $keys,
                'playerPearls' => $this->getPlayerPearls($player_id),
                'pearls' => $pearls,
                'monsters' => count($monsters),
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'rewards' => $message
        ) );

        $this->notifyPlayer( $player_id, "monsterTokens", '', array(
                'monsters' => $monsters
        ) );

        $nextState = "next";

        $slots = Ally::getExploreSlots();
        if (array_some($slots, fn($s) => $s["faction"] == 10)) {
            $nextState = "exploreTakeAllyRemainingKrakens";
        }

        $this->gamestate->nextState($nextState);
    }
    
    function purchase(int $withNebulis = 0) {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        $this->checkAction('purchase');

        $player_id = intval($this->getActivePlayerId());

        // Do you have enough pearls?
        // Have you already purchased a card?
        $first_player_id = intval($this->getGameStateValue('first_player_id'));
        $purchase_cost = intval($this->getGameStateValue('purchase_cost'));
        $player_pearls = $this->getPlayerPearls($player_id);
        $player_nebulis = $withNebulis ? $this->getPlayerNebulis($player_id) : 0;

        $pearlCost = $purchase_cost - $withNebulis;
        $nebulisCost = $withNebulis;

        $has_purchased = intval($this->getUniqueValueFromDB( "SELECT player_has_purchased FROM player WHERE player_id = " . $player_id ));
        $maxPurchase = Lord::playerHas(111, $player_id) ? 2 : 1;

        if ($player_pearls < $pearlCost) {
            throw new BgaVisibleSystemException( "You don't have enough Pearls. You must pass." );
        }
        if ($player_nebulis < $nebulisCost) {
            throw new BgaVisibleSystemException( "You don't have enough Nebulis. You must pass." );
        }
        if ($has_purchased >= $maxPurchase) {
            throw new BgaVisibleSystemException( "You have already purchased a card. You must pass." );
        }

        if (!$this->canPayWithNebulis($player_id, $pearlCost, $nebulisCost)) {
            throw new BgaVisibleSystemException( "You can't pay with Nebulis if you still have Pearls" );
        }

        // Remove the pearls.
        $this->DbQuery( "UPDATE player SET player_has_purchased = player_has_purchased + 1, player_pearls = player_pearls - ".$pearlCost." WHERE player_id = " . $player_id );
        $this->DbQuery( "UPDATE player SET player_pearls = player_pearls + ".$pearlCost." WHERE player_id = " . $first_player_id );
        $this->applyHighwayman($first_player_id, $pearlCost);
        if ($withNebulis) {
            $this->DbQuery( "UPDATE player SET player_nebulis = player_nebulis - ".$nebulisCost." WHERE player_id = " . $player_id );
            $this->DbQuery( "UPDATE player SET player_nebulis = player_nebulis + ".$nebulisCost." WHERE player_id = " . $first_player_id );
            $this->checkNewKrakenOwner();
        }
        $this->incGameStateValue( 'purchase_cost', 1 );

        // Add the card to your hand
        $slots = Ally::getExploreSlots();
        $ally = end($slots);
        $this->DbQuery( "UPDATE ally SET place = ".($player_id * -1)." WHERE ally_id = " . $ally["ally_id"] );

        // Notify that the card has gone to that player
        $message = $nebulisCost > 0 ?
            ($pearlCost > 0 ? clienttranslate('${player_name} purchases ${card_name} for ${cost} Pearl(s) and ${nebulisCost} Nebulis') : clienttranslate('${player_name} purchases ${card_name} for ${nebulisCost} Nebulis')) :
            clienttranslate('${player_name} purchases ${card_name} for ${cost} Pearl(s)');
        $this->notifyAllPlayers( "purchase", $message, array(
                'ally' => $ally,
                'slot' => $ally["place"],
                'cost' => $pearlCost, // for logs
                'nebulisCost' => $nebulisCost, // for logs
                'playerPearls' => $this->getPlayerPearls($player_id),
                'playerNebulis' => $this->getPlayerNebulis($player_id),
                'firstPlayerPearls' => $this->getPlayerPearls($first_player_id),
                'firstPlayerNebulis' => $this->getPlayerNebulis($first_player_id),
                'player_id' => $player_id,
                'player_name' => $this->getPlayerNameById($player_id),
                'first_player_id' => $first_player_id,
                'card_name' => array( // for logs
                    'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                    'args' => array(
                        'value' => $ally["value"],
                        'faction' => $this->factions[$ally["faction"]]["ally_name"],
                        'i18n' => ['faction']
                    )
                ),
        ));
        
        if ($pearlCost > 0) {
            $this->incStat($pearlCost, "pearls_spent_purchasing_allies", $player_id);
        }
        if ($nebulisCost > 0) {
            $this->incStat($nebulisCost, "nebulis_spent_purchasing_allies", $player_id);
        }

        // Go back to the first player's explore action...
        $this->gamestate->nextState( "purchase" );
    }
    
    function pass() {
        $this->checkAction( 'pass' );

        // Now... to find the right transition ;)
        $state = $this->gamestate->state();
        if (isset($state["transitions"]["pass"])) {
            $this->gamestate->nextState( "pass" );
        } else {
            $this->returnToPrevious();
        }
    }
    
    function pay(array $ally_ids, int $withNebulis = 0) {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        $this->checkAction( 'pay' );

        $player_id = intval($this->getActivePlayerId());
        $lord_id = intval($this->getGameStateValue('selected_lord'));
        $lord = Lord::getInTrack( $lord_id );
        $ally_ids = array_unique($ally_ids);

        // Do you have these cards in your hand? (+ remove them if you do)
        $allies = Ally::removeCardsFromHand( $player_id, $ally_ids );

        // Do they satisfy diversity requirements?
        $r = Ally::getDiversityAndValue( $allies, $lord['faction'] );
        $shortfall = $this->getLordCost($lord, $player_id) - $r['value'];
        $hasDiplomat = Lord::playerHas( 24 , $player_id );

        if (!$hasDiplomat && !$r['includesRequired']) {
            throw new BgaUserException( $this->_("You must include an Ally of the Lord's faction.") );
        }
        if (($r['diversity'] + $r['krakens']) < $lord['diversity'] || $r['diversity'] > $lord['diversity']) {
            throw new BgaUserException( sprintf($this->_("You must use exactly %d different faction(s)."), $lord['diversity']) );
        }

        $purchase_cost = max(0, $shortfall);
        $player_pearls = $this->getPlayerPearls($player_id);
        $player_nebulis = $withNebulis ? $this->getPlayerNebulis($player_id) : 0;

        $pearlCost = $purchase_cost - $withNebulis;
        $nebulisCost = $withNebulis;

        if ($player_pearls < $pearlCost) {
            throw new BgaVisibleSystemException( "You do not have enough Pearls to make up the shortfall." );
        }
        if ($player_nebulis < $nebulisCost) {
            throw new BgaVisibleSystemException( "You do not have enough Nebulis to make up the shortfall." );
        }

        if (!$this->canPayWithNebulis($player_id, $pearlCost, $nebulisCost)) {
            throw new BgaVisibleSystemException( "You can't pay with Nebulis if you still have Pearls" );
        }

        // Are there any superfluous cards?
        if ($shortfall < 0) {
            $surplus = -$shortfall;
            // Do any cards have a value lower than the surplus?
            // Also, of a faction which is already represented
            foreach ($allies as $k => $ally) {
                if ($ally['value'] <= $surplus) {
                    // Is this faction represented elsewhere?
                    foreach ($allies as $k2 => $ally2) {
                        if ($k == $k2) continue;
                        if ($ally2['faction'] == $ally['faction'] && $ally['faction'] != 10)
                            throw new BgaUserException( $this->_("You cannot use superfluous cards to purchase a Lord.") );
                    }
                }
            }
        }

        // Pay pearls (if shortfall positive)
        if ($pearlCost > 0) {
            $this->DbQuery( "UPDATE player SET player_pearls = player_pearls - $pearlCost WHERE player_id = " . $player_id );
        }
        if ($nebulisCost > 0) {
            $this->DbQuery( "UPDATE player SET player_nebulis = player_nebulis - $nebulisCost WHERE player_id = " . $player_id );
            $this->checkNewKrakenOwner();
        }

        $krakenAllies = array_filter($allies, fn($ally) => $ally['faction'] == 10);
        foreach ($krakenAllies as $ally) {
            Ally::discard($ally['ally_id']);
            $this->incPlayerNebulis($player_id, $ally['value'] - 1, "recruit-kraken");
        }

        // Add the lord to your board!
        Lord::giveToPlayer( $lord_id, $player_id );

        $message = '';
        if ($pearlCost > 0) {
            $message = $nebulisCost > 0 ? 
                clienttranslate('${player_name} recruits ${lord_name} with ${num_allies} Allies, ${spent_pearls} Pearl(s) and ${spent_nebulis} Nebulis') :
                clienttranslate('${player_name} recruits ${lord_name} with ${num_allies} Allies and ${spent_pearls} Pearl(s)');
        } else {
            $message = $nebulisCost > 0 ? 
                clienttranslate('${player_name} recruits ${lord_name} with ${num_allies} Allies and ${spent_nebulis} Nebulis') :
                clienttranslate('${player_name} recruits ${lord_name} with ${num_allies} Allies');
        }

        $this->notifyAllPlayers( "recruit", $message, [
            'lord' => $lord,
            'spent_allies' => array_values($allies),
            'spent_pearls' => $pearlCost,
            'spent_nebulis' => $nebulisCost,
            'playerPearls' => $this->getPlayerPearls($player_id),
            'playerNebulis' => $this->getPlayerNebulis($player_id),
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
            "i18n" => array('lord_name'),
            "lord_name" => $this->lords[$lord_id]["name"],
            'num_allies' => count($allies),
            'allyDiscardSize' => Ally::getDiscardSize(),
        ]);

        $used109 = null;
        $opponentsIds = $this->getOpponentsIds($player_id);
        foreach($opponentsIds as $opponentId) {
            if (Lord::playerHas(109, $opponentId)) {
                $used109 = $opponentId;
                $this->incPlayerPearls($opponentId, 1, "lord_109");
            }
        }

        $this->setGlobalVariable(CANCEL_RECRUIT, [
            'lord_id' => $lord['lord_id'],
            'spent_allies' => array_values($allies),
            'spent_pearls' => $pearlCost,
            'spent_nebulis' => $nebulisCost,
            'used109' => $used109,
        ]);

        $this->gamestate->nextState("pay");
    }

    function cancelRecruit() {
        $this->checkAction('cancelRecruit');
        
        $cancel = $this->getGlobalVariable(CANCEL_RECRUIT);
        //'spent_allies' => array_values($allies), // TODO on cancel, take back nebulis from spent Krakens

        $this->debug($cancel);

        /* TODO $this->notifyAllPlayers( "cancelRecruit", $message, [
            'lord' => $lord,
            'spent_allies' => array_values($allies),
            'spent_pearls' => $pearlCost,
            'spent_nebulis' => $nebulisCost,
            'playerPearls' => $this->getPlayerPearls($player_id),
            'playerNebulis' => $this->getPlayerNebulis($player_id),
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
            "i18n" => array('lord_name'),
            "lord_name" => $this->lords[$lord_id]["name"],
            'num_allies' => count($allies),
            'allyDiscardSize' => Ally::getDiscardSize(),
        ]);*/

        $this->gamestate->nextState("cancel");
    }
    
    function requestSupport(int $faction) {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        $this->checkAction( 'requestSupport' );

        $player_id = intval($this->getActivePlayerId());

        if ($this->isKrakenExpansion()) {
            $guarded = $this->guardedBySentinel('council', $faction);
            if ($guarded !== null) {
                if ($guarded->playerId == $player_id) {
                    $this->discardSentinel($guarded->lordId);
                } else {
                    throw new BgaVisibleSystemException( "That stack is not available (reserved by a sentinel)." );
                } 
            }
        }

        $state = $this->gamestate->state();
        if ($state['name'] == 'lord17') {
            // You can discard a stack
            $num = Ally::discardCouncilSlot( $faction );

            if ($num == 0) {
                throw new BgaVisibleSystemException( "You cannot discard an empty stack." );
            }

            // Use Lord
            Lord::use( 17 );
            $this->notifyPlayer( $player_id, "useLord", '', array(
                    'lord_id' => 17
            ) );

            $this->notifyAllPlayers( "discardCouncil", clienttranslate('${player_name} discards ${num} card(s) from the ${council_name} with ${lord_name}'), [
                'num' => $num,
                'player_id' => $player_id,
                'faction' => $faction,
                'player_name' => $this->getActivePlayerName(),
                "i18n" => array('lord_name'),
                "lord_name" => $this->lords[17]["name"],
                'council_name' => array(
                    'log' => '<span style="color:'.$this->factions[$faction]["colour"].'">' . clienttranslate('${faction} council') . '</span>',
                    'args' => array(
                        'faction' => $this->factions[$faction]["ally_name"],
                        'i18n' => ['faction']
                    )
                    ),
                    'allyDiscardSize' => Ally::getDiscardSize(),
            ]);

            $this->returnToPrevious();
            return;
        }

        $allies = Ally::drawCouncilSlot( $faction, $player_id );
        if (count($allies) == 0) {
            throw new BgaVisibleSystemException( "There are no Allies of that faction in the council." );
        }
        
        $this->incStat( 1, "times_council", $player_id );

        // Notification
        $this->notifyAllPlayers( "requestSupport", clienttranslate('${player_name} takes ${num} card(s) from the ${council_name}'), array(
                'faction' => $faction,
                'num' => count($allies),
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'council_name' => array(
                    'log' => '<span style="color:'.$this->factions[$faction]["colour"].'">' . clienttranslate('${faction} council') . '</span>',
                    'args' => array(
                        'faction' => $this->factions[$faction]["ally_name"],
                        'i18n' => ['faction']
                    )
                )
        ) );

        $this->notifyPlayer( $player_id, "requestSupportCards", '', array(
                'faction' => $faction,
                'allies' => $allies,
                'player_id' => $player_id
        ) );

        // If the player has the Alchemist, and there is another stack to take, ask them to take another
        if ($state['name'] == 'plotAtCourt' || $state['name'] == 'action' || $state['name'] == 'secondStack') {
            if (Lord::playerHas( 18, $player_id )) {
                $council = Ally::getCouncilSlots();
                foreach ($council as $pile) {
                    if ($pile > 0) {
                        $this->gamestate->nextState( "requestSupport2" );
                        return;
                    }
                }
            }
        }
        $this->gamestate->nextState( "requestSupport" );
    }
    
    function plot( ) {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        $this->checkAction( 'plot' );

        // Spend 1 pearl, draw 1 Lord
        $player_id = $this->getActivePlayerId();
        $pearls = $this->getPlayerPearls( $player_id );
        if ($pearls < 1) {
            throw new BgaVisibleSystemException( "You don't have enough Pearls." );
        }
        $this->DbQuery( "UPDATE player SET player_pearls = player_pearls - 1 WHERE player_id = " . $player_id );

        $lord = Lord::draw( );

        $this->incStat( 1, "times_plotted", $player_id );
        $this->notifyAllPlayers( "plot", clienttranslate('${player_name} pays 1 Pearl to reveal a new Lord'), array(
                'lord' => $lord,
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'playerPearls' => $this->getPlayerPearls($player_id),
                'pearls' => 1,
                'deck_size' => Lord::getDeckSize()
        ) );

        $this->gamestate->nextState( "plot" );
    }
    
    function discard(array $ally_ids ) {
        $this->checkAction( 'discard' );

        $player_id = intval($this->getCurrentPlayerId());
        $hand = Ally::getPlayerHand( $player_id );
        $affiliated = Ally::getPlayerAffiliated( $player_id );
        $ally_ids = array_unique($ally_ids);

        $state = $this->gamestate->state();
        $source = '';
        
        $afterMartialLaw = 'stay';

        if ($state['name'] == 'martialLaw') {
            $args = $this->argMartialLaw();
            if (count($ally_ids) > $args['diff']) {
                throw new BgaUserException(sprintf($this->_("You must discard %d card(s)."), $args['diff']));
            } else if (count($ally_ids) == $args['diff']) {
                $afterMartialLaw = 'next';
            }

            $allies = Ally::typedAllies($this->getCollection( "SELECT * FROM ally WHERE place = -" . $player_id . " AND NOT affiliated AND ally_id IN (".implode(",", $ally_ids).")"));
            if (array_some($allies, fn($ally) => $ally['faction'] == 10)) {
                throw new BgaUserException($this->_("You cannot discard Kraken Allies in this way."));
            }
        } else if ($state['name'] == 'lord2') {
            // Discard 1 card
            $source = "lord_2";
            if (count($ally_ids) != 1) {
                throw new BgaUserException( sprintf( $this->_("You must discard %d card(s)."), 1 ) );
            }
        } else if ($state['name'] == 'lord5' || $state['name'] == 'cleanupDiscard' || $state['name'] == 'postpurchaseDiscard') {
            // Discard until you have 6 cards in hand
            $source = "lord_5";
            if (count($hand) - count($ally_ids) != 6) {
                throw new BgaUserException( sprintf( $this->_("You must discard %d card(s)."), count($hand) - 6 ) );
            }
        } else if ($state['name'] == 'lord114multi') {
            // Discard 1 card
            $source = "lord_114";
            if (count($ally_ids) != 1) {
                throw new BgaUserException( sprintf( $this->_("You must discard %d card(s)."), 1 ) );
            }
            $ally = Ally::get($ally_ids[0]);
            $faction = intval($this->getGameStateValue(SELECTED_FACTION));
            if ($ally['faction'] != $faction) {
                throw new BgaUserException( sprintf( $this->_("You must discard %s card(s)."), $this->factions[$faction]["ally_name"]) );
            }
        } else {
            throw new BgaVisibleSystemException( "Not implemented." );
        }

        $allies_lost = array();
        foreach ($ally_ids as $ally_id) {
            $found = null;
            foreach (($source == "lord_114" ? $affiliated : $hand) as $a) {
                if ($a["ally_id"] == $ally_id) {
                    $found = $a;
                    break;
                }
            }
            if (!isset($found)) {
                throw new BgaVisibleSystemException($source == "lord_114" ? "You cannot discard that Ally (it isn't affiliated)." : "You cannot discard that Ally (it isn't in your hand).");
            }
            $allies_lost[] = $found;
            Ally::discard( $ally_id );
        }

        // Notify all
        $this->notifyAllPlayers( "diff", '', array(
                'player_id' => $player_id,
                'allies_lost' => $allies_lost,
                'source' => $source,
                'allyDiscardSize' => Ally::getDiscardSize(),
        ) );

        if ($state['name'] == 'martialLaw') {
            $this->gamestate->nextState($afterMartialLaw);
        } else if ($state['name'] == 'cleanupDiscard' || $state['name'] == 'postpurchaseDiscard') {
            $this->gamestate->nextState( "next" );
        } else {
            $this->gamestate->setPlayerNonMultiactive($player_id, 'next');
        }
    }
    
    function chooseMonsterTokens(int $target_player_id, int $type) {
        $this->checkAction( 'chooseMonsterTokens' );

        $player_id = intval($this->getCurrentPlayerId());

        if ($player_id == $target_player_id) {
            throw new BgaUserException("You are stealing yourself");
        }

        $hand = Monster::getPlayerHand( $target_player_id );

        if (count($hand) == 0) {
            throw new BgaUserException( $this->_("That player has no Monster tokens.") );
        }

        if (Lord::playerProtected( $target_player_id ))
            throw new BgaUserException( $this->_("That player is protected by The Shaman.") );

        // Pick a random Monster and give it to the current player
        $monstersOfType = array_values(array_filter($hand, fn($token) => $token['type'] == $type));
        if (count($monstersOfType) == 0) {
            throw new BgaUserException("That player doesn't have this type of Monster token");
        }

        $monster = $monstersOfType[bga_rand(0, count($monstersOfType) - 1)];
        Monster::giveToPlayer( $player_id, $monster["monster_id"] );

        // Notify all
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $pid => $p) {
            if ($pid == $player_id || $pid == $target_player_id) {
                $this->notifyPlayer( $pid, "diff", '', array(
                        'player_id' => $player_id,
                        'monster' => [$monster],
                        'source' => "player_$target_player_id",
                        'allyDiscardSize' => Ally::getDiscardSize(),
                ) );
            } else {
                $this->notifyPlayer( $pid, "diff", '', array(
                        'player_id' => $player_id,
                        'monster_count' => 1,
                        'source' => "player_$target_player_id",
                        'allyDiscardSize' => Ally::getDiscardSize(),
                ) );
            }
        }
        
        $this->notifyAllPlayers( "message", clienttranslate('${player_name} steals ${rewards} from ${player_name2}'), array(
            'player_name2' => $this->getPlayerNameById($target_player_id),
            'player_id' => $player_id,
            'player_name' =>  $this->getPlayerNameById($player_id),
            'rewards' =>  $type == 1 ? '<i class="icon icon-monster-leviathan"></i>' : '<i class="icon icon-monster"></i>',
        ) );

        $this->gamestate->nextState( "next" );
    }
    
    function selectLord(int $lord_id ) {
        $this->checkAction( 'selectLord' );

        $player_id = intval($this->getCurrentPlayerId());
        $lord = Lord::get( $lord_id );

        $state = $this->gamestate->state();
        if ($state["name"] == "lord23") {
            // Swap a Lord with court
            if ($lord["place"] != -1 * $player_id) {
                throw new BgaUserException( $this->_("You must select one of your own Lords.") );
            }

            if ($lord_id == 23) {
                throw new BgaUserException( $this->_("You must choose a different Lord.") );
            }

            if ($lord["location"]) {
                throw new BgaVisibleSystemException( "That Lord is not free." );
            }

            // Discard the Lord
            Lord::discard( $lord_id );

            $this->notifyAllPlayers( "recruit", clienttranslate('${player_name} discards ${lord_name} for ${lord_name2}'), array(
                    'spent_lords' => [$lord],
                    'player_id' => $player_id,
                    'player_name' => $this->getActivePlayerName(),
                    "i18n" => array('lord_name', 'lord_name2'),
                    'lord_name' => $this->lords[$lord_id]["name"],
                    "lord_name2" => $this->lords[23]["name"],
                    'allyDiscardSize' => Ally::getDiscardSize(),
            ) );

            $this->gamestate->nextState( "selectLord" );
        } else if ($state["name"] == "lord26") {
            // Swap a Lord with topdeck
            if ($lord["place"] != -1 * $player_id) {
                throw new BgaUserException( $this->_("You must select one of your own Lords.") );
            }

            if ($lord_id == 26) {
                throw new BgaUserException( $this->_("You must choose a different Lord.") );
            }

            if ($lord["location"]) {
                throw new BgaVisibleSystemException( "That Lord is not free." );
            }

            // Discard the Lord, and give the player a new one!
            Lord::discard( $lord_id );
            $lord2 = Lord::injectTextSingle($this->getObject( "SELECT * FROM lord WHERE place = 0 ORDER BY RAND() LIMIT 1" ));
            Lord::giveToPlayer( $lord2["lord_id"], $player_id );

            $this->notifyAllPlayers( "recruit", clienttranslate('${player_name} swaps ${lord_name} for ${lord_name2} using ${lord_name3}'), array(
                    'lord' => $lord2,
                    'spent_lords' => [$lord],
                    'player_id' => $player_id,
                    'player_name' => $this->getActivePlayerName(),
                    "i18n" => array('lord_name', 'lord_name2', 'lord_name3'),
                    'lord_name' => $this->lords[$lord_id]["name"],
                    "lord_name2" => $this->lords[$lord2["lord_id"]]["name"],
                    "lord_name3" => $this->lords[26]["name"],
                    'allyDiscardSize' => Ally::getDiscardSize(),
            ) );

            $this->setGameStateValue( 'selected_lord', $lord2["lord_id"] );

            $this->gamestate->nextState( "selectLord" );
        } else if ($state["name"] == "lord4") {
            if ($lord["place"] == (-1 * $player_id)) {
                throw new BgaUserException( $this->_("You cannot disable one of your own Lords.") );
            }

            if (Lord::playerProtected( -1 * $lord["place"] )) {
                throw new BgaUserException( $this->_("That player is protected by The Shaman.") );
            }

            if ($lord["turned"]) {
                throw new BgaUserException( $this->_("That Lord has already been disabled.") );
            }

            if ($lord["location"]) {
                throw new BgaVisibleSystemException( "That Lord is not free." );
            }

            $players = $this->loadPlayersBasicInfos();
            $allDone = true;
            foreach ($players as $pid => $player) {
                $lords = Lord::getPlayerHand($pid);
                $found = false;
                $freeLord = false;
                if ($pid == $player_id) {
                    $found = true;
                }
                if ( ! $found ) {
                    if (Lord::playerProtected( $pid )) {
                        $found = true;
                    }
                }
                if ( ! $found ) {
                    foreach ($lords as $l) {
                        if (! $l["location"]) {
                            $freeLord = true;
                        }
                        if ($l["turned"]) {
                            // This player has a turned lord (or no free lords)
                            $found = true;
                        }
                    }
                }
                if ($pid == -1 * $lord["place"]) {
                    if ($found)
                        throw new BgaUserException( $this->_("You have already disabled a Lord for that player.") );
                    // Disable the Lord!
                    $found = true;
                    Lord::disable( $lord_id );
                    $this->notifyAllPlayers( "disable", clienttranslate('${player_name} disables ${lord_name} using ${lord_name2}'), array(
                            'lord_id' => $lord_id,
                            'player_id' => $player_id,
                            'player_name' => $this->getActivePlayerName(),
                            "i18n" => array('lord_name', 'lord_name2'),
                            'lord_name' => $this->lords[$lord_id]["name"],
                            "lord_name2" => $this->lords[4]["name"],
                    ) );
                }
                if (! $found && $freeLord && $pid != $player_id) {
                    $allDone = false;
                }
            }

            // If each other player has a disabled Lord, or no free Lords, then advance to the next state
            if ($allDone) {
                $this->gamestate->nextState( "next" );
            }
        }
    }

    function applyDirectLordEffect(int $playerId, int $lordId) {
        if ($lordId == 101) {
            $playerNebulis = $this->getPlayerNebulis($playerId);

            if ($playerNebulis < 1) {
                throw new BgaVisibleSystemException("You don't have enough Nebulis.");
            }

            $this->incPlayerPearls($playerId, 1, "lord_101");
            $this->incPlayerNebulis($playerId, -1, '');

            return true;
        }

        if ($lordId == 115) {
            if (count(Lord::getSlots()) == 6) {
                throw new BgaUserException( $this->_("There are no free space on the court.") );
            }
            if (Lord::getDeckSize() == 0) {
                throw new BgaUserException( $this->_("There are no Lords left in the deck.") );
            }

            $lord = Lord::draw();
            $this->notifyAllPlayers( "plot", clienttranslate('${player_name} uses The Recipient to reveal a new Lord'), array(
                    'lord' => $lord,
                    'player_id' => $playerId,
                    'player_name' => $this->getActivePlayerName(),
                    'playerPearls' => $this->getPlayerPearls($playerId),
                    'pearls' => 0,
                    'deck_size' => Lord::getDeckSize()
            ) );
            return true;
        }

        return false;
    }
    
    function lordEffect(int $lord_id ) {
        $this->checkAction( 'lordEffect' );

        $playerId = $this->getCurrentPlayerId();
        $lord = Lord::get( $lord_id );

        $nextState = "lord_$lord_id";

        // Must be an unused, unturned, free Lord, owned by the player with a TURN effect...
        if ($lord["place"] != -1 * $playerId)
            throw new BgaUserException( $this->_("You do not own that Lord.") );
        if ($lord["used"])
            throw new BgaUserException( $this->_("You have already used that Lord.") );
        if ($lord["turned"])
            throw new BgaUserException( $this->_("That Lord has been disabled by the Assassin.") );
        if (isset($lord["location"]))
            throw new BgaUserException( $this->_("That Lord is not free.") );
        if ($lord["effect"] != Lord::EFFECT_TURN)
            throw new BgaUserException( $this->_("That Lord does not have an activated ability.") );

        // Times when you can't use a Lord
        if ($lord_id == 21 && Lord::getDeckSize() == 0) {
            // Opportunist - can't use if no Lords in the deck
            throw new BgaUserException( $this->_("There are no Lords left in the deck.") );
        } else if ($lord_id == 12 && Ally::getPlayerHandSize($playerId) == 0) {
            // Slaver - can't use if no cards in hand
            throw new BgaUserException( $this->_("You have no Ally cards in your hand.") );
        } else if ($lord_id == 17 && max(Ally::getCouncilSlots()) == 0) {
            // Oracle - can't use if no council stacks
            throw new BgaUserException( $this->_("There are no Council stacks to discard.") );
        }

        $directLordEffect = $this->applyDirectLordEffect($playerId, $lord_id);

        if ($directLordEffect) {
            Lord::use($lord_id);
            $this->notifyPlayer( $playerId, "useLord", '', [
                'lord_id' => $lord_id,
            ]);
            $nextState = "loopback";
        }

        $this->setGameStateValue("previous_state", $this->gamestate->state_id());
        $this->gamestate->nextState($nextState);
    }

    function drawLocations(int $num ) {
        $this->checkAction( 'drawLocations' );

        $player_id = $this->getCurrentPlayerId();

        if ($num <= 0 || $num > 4)
            throw new BgaVisibleSystemException( "You must draw 1-4 cards." );

        if ($num > Location::getDeckSize()) {
            throw new BgaUserException( $this->_("There are not enough Locations left in the deck.") );
        }

        // Draw the given number of cards...
        $new_locations = array();
        for ($i=1; $i<=$num; $i++) {
            $loc = Location::draw();
            $new_locations[] = $loc;
            $this->setGameStateValue( "location_drawn_$i", $loc["location_id"] );
        }

        // Tell people about the new locations
        $this->notifyAllPlayers( "newLocations", '', array(
                'locations' => $new_locations,
                'deck_size' => Location::getDeckSize(),
        ) );

        $this->gamestate->nextState( "drawLocations" );
    }

    function chooseLocation(int $location_id, array $lord_ids ) {
        $this->checkAction( 'chooseLocation' );

        $player_id = intval($this->getCurrentPlayerId());
        $location = Location::get($location_id);

        if (!isset($location)) {
            throw new BgaVisibleSystemException( "Location not found." );
        }

        if ($this->isKrakenExpansion()) {
            $guarded = $this->guardedBySentinel('location', $location_id);
            if ($guarded !== null) {
                if ($guarded->playerId == $player_id) {
                    $this->discardSentinel($guarded->lordId);
                } else {
                    throw new BgaVisibleSystemException( "That Location is not available (reserved by a sentinel)." );
                } 
            }
        }

        $state = $this->gamestate->state();
        $trapped_lords = array();
        if ($state["name"] == "lord19") {
            // You must choose a Location you own
            if ($location["place"] != -1 * $player_id) {
                throw new BgaUserException( $this->_("You must choose a Location you own first.") );
            }

            $this->setGameStateValue( "temp_value", $location["location_id"] );

            $this->gamestate->nextState( "chooseLocation" );
            return;
        } else if ($state["name"] == "lord19b") {
            // Swap locations!
            if ($location["place"] != 1) {
                throw new BgaUserException( $this->_("You must select an available Location.") );
            }

            $old_location_id = intval($this->getGameStateValue("temp_value"));

            // Move any Lords to the new Location
            $this->DbQuery( "UPDATE lord SET location = $location_id WHERE location = $old_location_id" );

            // Move the old Location to the available ones
            $this->DbQuery( "UPDATE location SET place = 1 WHERE location_id = $old_location_id" );

            $trapped_lords = Lord::injectText($this->getCollectionFromDb( "SELECT * FROM lord WHERE location = $location_id" ));

            $this->notifyAllPlayers( "loseLocation", '', array(
                    'location_id' => $old_location_id,
                    'player_id' => $player_id
            ) );
            $this->notifyAllPlayers( "newLocations", '', array(
                    'locations' => array(Location::get($old_location_id)),
                    'deck_size' => Location::getDeckSize(),
            ) );
        } else if ($state["name"] == "locationEffectBlackSmokers") {
            // You must pick a Location from the deck
            if ($location["place"] != 0) {
                throw new BgaUserException( $this->_("You must choose a Location from the deck.") );
            }

            // Move any Lords to the new Location
            $this->DbQuery( "UPDATE lord SET location = $location_id WHERE location = 10" );

            // Discard the old Location
            $this->DbQuery( "UPDATE location SET place = 10 WHERE location_id = 10" );

            $trapped_lords = Lord::injectText($this->getCollectionFromDb( "SELECT * FROM lord WHERE location = $location_id" ));

            $this->notifyAllPlayers( "loseLocation", '', array(
                    'location_id' => 10,
                    'player_id' => $player_id
            ) );
        } else {
            // If location_drawn_1-4 are not -1, then you must pick one of those
            $available_locations = $this->argControlPostDraw()["location_ids"];
            if (count($available_locations) > 0 && ! in_array($location_id, $available_locations)) {
                throw new BgaUserException( $this->_("You must choose one of the Locations you just drew.") );
            }

            if ($location["place"] != 1) {
                throw new BgaUserException( $this->_("You must select an available Location.") );
            }

            $lords = Lord::getPlayerHand( $player_id );
            $ambassadorLord = $this->array_find($lords, fn($lord) => in_array($lord["lord_id"], [33, 34, 35]) && !$lord["turned"] && !isset($lord["location"]));
            $ambassador = false;
            if ($ambassadorLord != null) {
                $ambassador = true;
                $lord_ids = [$ambassadorLord['lord_id']];
            }

            $keys_from_lords = 0;
            foreach ($lord_ids as $lord_id) {
                $lord = Lord::get($lord_id);
                $trapped_lords[] = $lord;
                if ($lord["place"] != -1 * $player_id) {
                    throw new BgaVisibleSystemException( "You can only use Lords you own to control a Location." );
                }
                if (isset($lord["location"])) {
                    throw new BgaVisibleSystemException( "You can only use free Lords to control a Location." );
                }
                if ($lord["turned"]) {
                    throw new BgaUserException( $this->_("You cannot use Lords disabled by the Assassin.") );
                }
                if ($lord["keys"] == 0 && !$ambassador) {
                    throw new BgaUserException( $this->_("You can only use Lords with keys to control a Location.") );
                }
                $keys_from_lords += +$lord["keys"];

                // Lock Lord into Location (we'll revert later if this is premature)
                $this->DbQuery( "UPDATE lord SET location = $location_id WHERE lord_id = $lord_id" );
            }

            if ($keys_from_lords > 3 && !$ambassador)
                throw new BgaUserException( $this->_("You can not use superfluous Lords to control a Location.") );

            $key_tokens_needed = 3 - $keys_from_lords;

            if ($key_tokens_needed > 0 && !$ambassador) {
                $player_keys = $this->getPlayerKeys( $player_id );
                if ($player_keys < $key_tokens_needed) {
                    throw new BgaUserException( $this->_("You do not have enough Key tokens. You must select additional Lords.") );
                }
                $this->incPlayerKeys( $player_id, -1 * $key_tokens_needed, "location_$location_id" );
            }
        }

        // Give Location to Player
        $this->DbQuery( "UPDATE location SET place = -$player_id WHERE location_id = $location_id" );

        $this->notifyAllPlayers( "control", clienttranslate('${player_name} takes ${location_name}'), array(
                'location' => $location,
                'lords' => $trapped_lords,
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'location_name' => $this->locations[$location_id]["name"],
                'i18n' => array('location_name'),
        ) );

        $this->updatePlayerScore( $player_id, false );

        if ($location["location_id"] == 10) {
            $this->gamestate->nextState("locationEffectBlackSmokers");
        } else if (in_array($location_id, [103, 104, 105, 106])) {
            $this->setGameStateValue(LAST_LOCATION, $location["location_id"]);
            $this->gamestate->nextState("fillSanctuary");
        } else {
            $this->gamestate->nextState("chooseLocation");
        }
    }

    function selectAlly(int $ally_id ) {
        $this->checkAction( 'selectAlly' );

        $player_id = intval($this->getCurrentPlayerId());
        $hand = Ally::getPlayerHand( $player_id );

        $state = $this->gamestate->state();
        $allies_lost = array();
        if ($state['name'] == 'lord12') {
            // Discard 1 Ally to gain 2 Pearls
            $source = "lord_12";
            $found = null;
            foreach ($hand as $a) {
                if ($a["ally_id"] == $ally_id) {
                    $found = $a;
                    $allies_lost[] = $a;
                    break;
                }
            }
            if (! isset($found)) {
                throw new BgaVisibleSystemException( "You cannot discard that Ally (it isn't in your hand)." );
            }
            Ally::discard( $ally_id );

            // Use Lord
            Lord::use( 12 );
            $this->notifyPlayer( $player_id, "useLord", '', array(
                    'lord_id' => 12
            ) );

            // Notify all
            $this->notifyAllPlayers( "diff", '', array(
                    'player_id' => $player_id,
                    'allies_lost' => $allies_lost,
                    'source' => $source,
                    'allyDiscardSize' => Ally::getDiscardSize(),
            ) );
            $this->incPlayerPearls( $player_id, 2, "lord_12" );

            $this->returnToPrevious();
            return;
        }

        throw new BgaVisibleSystemException( "Not implemented." );
    }
    
    function setAutopass(array $autopass ) {
        $player_id = $this->getCurrentPlayerId();
        
        $autopass_string = implode(";", $autopass);
        
        Abyss::DbQuery( "UPDATE player SET player_autopass = '$autopass_string' WHERE player_id = $player_id" );
        
        // $this->gamestate->nextState( 'loopback' );
    }

    function payMartialLaw() {
        $this->checkAction('payMartialLaw');

        $playerId = $this->getActivePlayerId();

        $args = $this->argMartialLaw();
        $playerPearls = $this->getPlayerPearls($playerId);
        $diff = $args['diff'];

        if ($playerPearls < $diff) {
            throw new BgaVisibleSystemException("You do not have enough pearls to pay.");
        }

        $this->DbQuery( "UPDATE player SET player_pearls = player_pearls - $diff WHERE player_id = $playerId");

        $this->notifyAllPlayers("payMartialLaw", clienttranslate('${player_name} pays ${diff} pearl(s) for martial law'), [
            'playerPearls' => $this->getPlayerPearls($playerId),
            'spentPearls' => $diff,
            'playerId' => $playerId,
            'diff' => $diff, // for log
            'player_name' => $this->getActivePlayerName(),
        ]);

        $this->gamestate->nextState('next');
    }

    function searchSanctuary() {
        $this->checkAction('searchSanctuary');

        $playerId = intval($this->getActivePlayerId());
        $locationId = intval($this->getGameStateValue(LAST_LOCATION));

        $this->notifyAllPlayers("log", clienttranslate('${player_name} chooses to continue searching'), [
            'player_name' => $this->getActivePlayerName(),
        ]);

        $previousLoots = LootManager::getLootOnLocation($locationId);

        $newLoot = $this->applySearchSanctuary($playerId, $locationId);

        $duplicateLoot = $this->array_find($previousLoots, fn($loot) => $loot->value == $newLoot->value);

        if ($duplicateLoot != null) {
            LootManager::discard($locationId, $duplicateLoot->value);

            $this->notifyAllPlayers("highlightLootsToDiscard", clienttranslate('${player_name} draw a loot of the same value as a previous one (${value}) and must discard them and stop searching'), [
                'playerId' => $playerId,
                'player_name' => $this->getActivePlayerName(),
                'locationId' => $locationId,
                'loots' => [$duplicateLoot, $newLoot],
                'value' => $duplicateLoot->value,
            ]);
            $this->notifyAllPlayers("discardLoots", '', [
                'playerId' => $playerId,
                'locationId' => $locationId,
                'loots' => [$duplicateLoot, $newLoot],
                'value' => $duplicateLoot->value,
            ]);

            $this->gamestate->nextState('next');
        } else {
            $this->gamestate->nextState('stay');
        }
    }

    function stopSanctuarySearch() {
        $this->checkAction('stopSanctuarySearch');

        $this->notifyAllPlayers("log", clienttranslate('${player_name} chooses to stop searching'), [
            'player_name' => $this->getActivePlayerName(),
        ]);

        $this->gamestate->nextState('next');
    }

    function freeLord(int $id) {
        $this->checkAction('freeLord');

        $args = $this->argLord116();
        if (!array_some($args['lords'], fn($lord) => $lord['lord_id'] == $id)) {
            throw new BgaVisibleSystemException("That Lord is not available.");
        }

        $playerId = intval($this->getActivePlayerId());

        $lord = Lord::get($id);
        Lord::freeLord($id);

        $this->notifyAllPlayers("recruit", clienttranslate('${player_name} frees lord ${lord_name}'), [
            'lord' => $lord,
            'player_id' => $playerId,
            'player_name' => $this->getActivePlayerName(),
            "i18n" => ['lord_name'],
            "lord_name" => $this->lords[$id]["name"],
            'allyDiscardSize' => Ally::getDiscardSize(),
            'freeLord' => true,
        ]);

        if (in_array($id, [33, 34, 35])) {
            $this->setGameStateValue('selected_lord', $id);
            $this->gamestate->nextState('selectNewLocation');
        } else {
            $this->gamestate->nextState('freeLord');
        }
    }

    function selectAllyRace(int $faction) {
        $this->checkAction('selectAllyRace');

        if ($faction < 0 || $faction > 4) {
            throw new BgaVisibleSystemException("Invalid faction");
        }

        $this->setGameStateValue(SELECTED_FACTION, $faction);

        $this->notifyAllPlayers('log', clienttranslate('${player_name} chooses Ally race ${faction}'), [
            'player_name' => $this->getActivePlayerName(),
            'faction' => $this->factions[$faction]["ally_name"],
            'i18n' => ['faction'],
        ]);

        $this->gamestate->nextState('next');

    }

    function takeAllyFromDiscard(int $id) {
        $this->checkAction('takeAllyFromDiscard');

        $ally = Ally::get($id);

        if ($ally['place'] != 10) {
            throw new BgaVisibleSystemException("This ally is not in the discard");
        }
        if ($ally['faction'] === null) {
            throw new BgaVisibleSystemException("You must take an Ally");
        }

        $playerId = intval($this->getActivePlayerId());

        $this->DbQuery( "UPDATE ally SET place = ".($playerId * -1)." WHERE ally_id = " . $ally["ally_id"] );

        // Notify that the card has gone to that player
        $this->notifyAllPlayers('takeAllyFromDiscard', clienttranslate('${player_name} takes ${card_name} from the discard'), [
            'ally' => $ally,
            'player_id' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card_name' => array( // for logs
                'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                'args' => array(
                    'value' => $ally["value"],
                    'faction' => $this->factions[$ally["faction"]]["ally_name"],
                    'i18n' => ['faction']
                ),
            ),
            'discardSize' => Ally::getDiscardSize(),
        ]);

        $this->gamestate->nextState('next');

    }

    function giveKraken(int $toPlayerId) {
        $this->checkAction('giveKraken');

        $this->setKrakenPlayer($toPlayerId);

        $this->setGlobalVariable(MUST_SELECT_NEW_PLAYER_FOR_KRAKEN, []);

        $transition = boolval($this->getGameStateValue(AFTER_GIVE_KRAKEN_FINAL_SCORE)) ? 'finalScore' : 'next';
        $this->gamestate->setPlayerNonMultiactive($this->getCurrentPlayerId(), $transition);
    }

    function goToPlaceSentinel() {
        $this->checkAction('goToPlaceSentinel');

        $this->setGameStateValue(AFTER_PLACE_SENTINEL, $this->gamestate->state_id());
        $this->gamestate->nextState('placeSentinel');
    }

    function placeSentinel(int $location, int $locationArg) {
        $this->checkAction('placeSentinel');

        if (!in_array($location, [1, 2, 3])) {
            throw new BgaVisibleSystemException("Invalid location");
        }

        $args = $this->argPlaceSentinel();
        if ($location == 1 && !$args['possibleOnLords']) {
            throw new BgaVisibleSystemException("Invalid zone");
        }
        if ($location == 2 && !$args['possibleOnCouncil']) {
            throw new BgaVisibleSystemException("Invalid zone");
        }
        if ($location == 3 && !$args['possibleOnLocations']) {
            throw new BgaVisibleSystemException("Invalid zone");
        }

        if ($location == 3 && Location::get($locationArg)['place'] != 1) {
            throw new BgaVisibleSystemException("This location is not free");
        }

        $playerId = intval($this->getActivePlayerId());

        $sentinel = $this->mustPlaceSentinel($playerId);

        $LOCATIONS = [
            1 => 'lord',
            2 => 'council',
            3 => 'location',
        ];

        $this->setSentinel($playerId, $sentinel->lordId, $LOCATIONS[$location], $locationArg);

        if ($this->mustPlaceSentinel($playerId) != null) {
            $this->gamestate->nextState('nextSentinel');
        } else {
            $this->gamestate->jumpToState($this->getGameStateValue(AFTER_PLACE_SENTINEL));
        }
    }

    function giveNebulisTo(array $opponentsIds) {
        $this->checkAction('giveNebulisTo');

        $playerId = intval($this->getActivePlayerId());

        foreach ($opponentsIds as $opponentId) {
            $this->incPlayerNebulis($opponentId, 1, "lord_104", false);
        }
        $this->incPlayerNebulis($playerId, -count($opponentsIds), "lord_104", false);
        $this->checkNewKrakenOwner();

        $this->gamestate->nextState('next');
    }

    function placeKraken(int $faction) {
        $this->checkAction('placeKraken');

        $playerId = intval($this->getActivePlayerId());

        $ally = $this->argPlaceKraken()['ally'];

        $this->DbQuery( "UPDATE ally SET place = 100 + $faction WHERE ally_id = ".$ally['ally_id']);

        $this->notifyAllPlayers('placeKraken', clienttranslate('${player_name} sends ${card_name} to ${councilFaction} council stack'), [
            'ally' => $ally,
            'player_id' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card_name' => array( // for logs
                'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                'args' => array(
                    'value' => $ally["value"],
                    'faction' => $this->factions[$ally["faction"]]["ally_name"],
                    'i18n' => ['faction']
                )
            ),
            'faction' => $faction,
            'councilFaction' => $this->factions[$faction]["ally_name"], // for logs
            'deckSize' => Ally::getCouncilSlots()[$faction],
        ]);

        $this->gamestate->nextState(count(Ally::getExploreSlots()) > 0 ? 'nextKraken' : 'next');

        
    }

    function actChooseLeviathanToFight(int $id) {
        $this->checkAction('actChooseLeviathanToFight');

        $playerId = intval($this->getActivePlayerId());

        $this->globals->set(FIGHTED_LEVIATHAN, $id);

        $this->notifyAllPlayers('setFightedLeviathan', '', [
            'leviathan' => LeviathanManager::getFightedLeviathan(),
        ]);

        $this->gamestate->nextState('next');
    }

    function actChooseAllyToFight(int $id) {
        $this->checkAction('actChooseAllyToFight');

        $playerId = intval($this->getActivePlayerId());

        $this->globals->set(ALLY_FOR_FIGHT, $id);
        Ally::discard($id);
        $ally = Ally::get($id);
        $this->notifyAllPlayers("discardAllyTofight", clienttranslate('${player_name} discards ${card_name} to fight the Leviathan'), [
            'playerId' => $playerId,
            'player_name' => $this->getActivePlayerName(),
            'ally' => $ally,
            'allyDiscardSize' => Ally::getDiscardSize(),
            'card_name' => array( // for logs
                'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                'args' => array(
                    'value' => $ally["value"],
                    'faction' => $this->factions[$ally["faction"]]["ally_name"],
                    'i18n' => ['faction']
                )
            ),
        ]);
        
        if ($ally['faction'] == 10) {
            $this->incPlayerNebulis($playerId, $ally['value'] - 1, "fight-kraken");
        }

        $attackPower = LeviathanManager::initiateLeviathanFight($playerId, $ally);
        $this->globals->set(ATTACK_POWER, $attackPower);
        $this->gamestate->nextState('next');
    }

    function actIncreaseAttackPower(int $amount) {
        $this->checkAction('actIncreaseAttackPower');

        $args = $this->argIncreaseAttackPower();

        if (!$args['payPearlEffect']) {
            throw new BgaVisibleSystemException("Selected ally doesn't allow to pay pearls to increase attack");
        }

        if ($amount > $args['playerPearls']) {
            throw new BgaVisibleSystemException("Not enough pearls");
        }

		$playerId = (int)$this->getActivePlayerId();

        $this->DbQuery( "UPDATE player SET player_pearls = player_pearls - $amount WHERE player_id = $playerId");

        $this->notifyAllPlayers("payMartialLaw", clienttranslate('${player_name} pays ${diff} pearl(s) to increase attack power by ${diff}'), [
            'playerPearls' => $this->getPlayerPearls($playerId),
            'spentPearls' => $amount,
            'playerId' => $playerId,
            'diff' => $amount, // for log
            'player_name' => $this->getActivePlayerName(),
        ]);

        $attackPower = $this->globals->inc(ATTACK_POWER, $amount);

        $this->notifyAllPlayers("log", clienttranslate('${player_name} attack power is now ${attackPower}'), [
            'attackPower' => $attackPower,
            'playerId' => $playerId,
            'player_name' => $this->getActivePlayerName(),
        ]);

        $this->resolveLeviathanAttack();
    }

    public function actChooseFightReward(int $base, int $expansion) {
        $this->checkAction('actChooseFightReward');

        $rewards = $this->argChooseFightReward()['rewards'];
        if ($rewards != ($base + $expansion)) {
            throw new BgaVisibleSystemException("Invalid selection");
        }

        $playerId = intval($this->getActivePlayerId());

        $monsters = [];

        for ($i = 0; $i < $rewards; $i++) {
            $monster = Monster::draw($playerId, $i < $base ? 0 : 1);
            if (isset($monster)) {
                $monsters[] = $monster;
            }
        }

        self::notifyPlayer($playerId, "monsterTokens", '', [
            'monsters' => $monsters,
        ]);

        $this->notifyAllPlayers( "lootReward", clienttranslate('${player_name} earns ${rewards} Monster tokens for defeating a Leviathan'), array(
                'keys' => 0,
                'playerPearls' => $this->getPlayerPearls($playerId),
                'pearls' => 0,
                'monsters' => count($monsters),
                'player_id' => $playerId,
                'player_name' => $this->getActivePlayerName(),
                'rewards' => $rewards
        ) );

        $monsters = Monster::getPlayerHand($playerId);
        $leviathanMonsterCount = count(array_filter($monsters, fn($monster) => $monster['type'] == 1));

        $this->gamestate->nextState($leviathanMonsterCount > 0 ? 'reveal' : 'next');
    }

    public function actFightAgain() {
        $this->checkAction('actFightAgain');

        $fightedLeviathan = $this->globals->get(FIGHTED_LEVIATHAN);

        // if we fight again with The Intrepid, we need to select a new Leviathan to fight
        $this->gamestate->nextState($fightedLeviathan === null ? 'fightNewLeviathan' : 'again');
    }

    public function actEndFight() {
        $this->checkAction('actEndFight');

        $this->applyEndFight();
    }

    public function actFightImmediately() {
        $this->checkAction('actFightImmediately');

        $this->gamestate->nextState('fight');
    }

    public function actIgnoreImmediatelyFightLeviathan() {
        $this->checkAction('actIgnoreImmediatelyFightLeviathan');

        $this->gamestate->nextState('ignore');
    }

    public function actRemoveHealthPointToLeviathan(int $id) {
        $this->checkAction('actRemoveHealthPointToLeviathan');

        $playerId = intval($this->getActivePlayerId());

        $this->globals->set(FIGHTED_LEVIATHAN, $id);
        $this->globals->set(SLAYED_LEVIATHANS, 99); // to make sure the game doesn't ask to fight again

        $leviathan = LeviathanManager::getFightedLeviathan();
        $rewards = LeviathanManager::moveLeviathanLife($playerId, $leviathan);
        LeviathanManager::checkLeviathanDefeated($playerId, $leviathan);  
        $this->globals->set(REMAINING_REWARDS, $rewards);

        $this->gamestate->nextState('next');
    }

    public function actChooseFreeSpaceForLeviathan(int $slot) {
        $this->checkAction('actChooseFreeSpaceForLeviathan');

        $playerId = intval($this->getActivePlayerId());
        Abyss::DbQuery("UPDATE leviathan SET place = $slot WHERE place = 99");

        $leviathan = LeviathanManager::getLeviathanAtSlot($slot);

        $this->notifyAllPlayers("newLeviathan", clienttranslate('${player_name} places the new Leviathan on the spot ${spot}'), [
            'playerId' => $playerId,
            'player_name' => $this->getActivePlayerName(),
            'spot' => LEVIATHAN_SLOTS_LABELS[$slot],
            'leviathan' => $leviathan,
        ]);

        $this->gamestate->nextState('next');
    }

    public function actIgnoreMonster() {
        $this->checkAction('actIgnoreMonster');

        $slots = Ally::getExploreSlots();
        if (count($slots) === 0) {
            throw new BgaUserException( $this->_("No monster to ignore") );
        }

        $slot = count($slots);
        $ally = end($slots);

        if ($ally['faction'] !== NULL) {
            throw new BgaUserException( $this->_("The last ally is not a Monster") );
        }
        $playerId = intval($this->getActivePlayerId());
        
        Ally::discard($ally["ally_id"]);
        $this->notifyAllPlayers( "discardExploreMonster", clienttranslate('${player_name} ignores a Monster'), [
            'ally' => $ally,
            'slot' => $slot,
            'player_id' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'allyDiscardSize' => Ally::getDiscardSize(),
        ]);

        $this->gamestate->jumpToState(ST_PLAYER_EXPLORE2);
    }

    function actDiscardLordLeviathanDamage(int $id) {
        $this->checkAction('actDiscardLordLeviathanDamage');
        $playerId = (int)$this->getCurrentPlayerId();

        $lord = Lord::get($id);
        Lord::discard($id);

        $this->notifyAllPlayers( "discardLords", '', [
            'lords' => [$lord],
            'playerId' => $playerId,
        ]);

        $this->gamestate->setPlayerNonMultiactive($playerId, 'next');
    }

    function actDiscardAlliesLeviathanDamage(array $ids) {
        $this->checkAction('actDiscardAlliesLeviathanDamage');
        $playerId = (int)$this->getCurrentPlayerId();

        $allies = array_map(fn($id) => Ally::get($id), $ids);
        foreach ($allies as $ally) {
            Ally::discard( $ally['ally_id'] );

            if ($ally['faction'] === 10) {
                $this->incPlayerNebulis($playerId, $ally['value'] - 1, "fight-leviathan-discard-ally");
            }
        }

        $this->notifyAllPlayers( "diff", '', array(
            'player_id' => $playerId,
            'allies_lost' => $allies,
            'source' => "player_$playerId",
            'allyDiscardSize' => Ally::getDiscardSize(),
        ) );

        $this->gamestate->setPlayerNonMultiactive($playerId, 'next');

    }

    function actChooseOpponentToRevealLeviathan(int $opponentId) {
        $this->checkAction('actChooseOpponentToRevealLeviathan');

        $redirected = $this->drawNewLeviathanAndRollDice($opponentId, ST_PRE_CONTROL);

        if ($redirected) {
            return; // stop here because the player first needs to discard monsters
        }

        $this->gamestate->nextState('next');
    }

    function actRevealReward(int $id) {
        $this->checkAction('actRevealReward');
        $playerId = (int)$this->getActivePlayerId();

        $monster = Monster::get($id);
        if ($monster['type'] != 1) {
            throw new BgaUserException("Not a Leviathan monster token");
        }
        if ($monster['place'] != -$playerId) {
            throw new BgaUserException("Not your monster token");
        }

        $pearls = 0;
        $keys = 0;
        $councilStack = false;
        $message = "";

        switch ($monster['effect']) {
            case 1: // 2 pearls
                $pearls += 2;
                $message .= '<i class="icon icon-pearl"></i><i class="icon icon-pearl"></i>';
                break;
            case 2: // 3 pearls
                $pearls += 3;
                $message .= '<i class="icon icon-pearl"></i><i class="icon icon-pearl"></i><i class="icon icon-pearl"></i>';
                break;
            case 3: // key
                $keys++;
                $message .= '<i class="icon icon-key"></i>';
                break;
            case 4: // ally
                $councilStack = true;
                $message .= '<i class="icon icon-ally"></i>';                
                break;
        }

        if (($keys + $pearls) > 0) {
            self::DbQuery("UPDATE player SET player_pearls = player_pearls + $pearls, player_keys = player_keys + $keys WHERE player_id = $playerId");
            $this->applyHighwayman($playerId, $pearls);
        }

        self::notifyAllPlayers("lootReward", clienttranslate('${player_name} earns ${rewards} with the revealed Leviathan monster token'), [
            'keys' => $keys,
            'playerPearls' => $this->getPlayerPearls($playerId),
            'pearls' => $pearls,
            'monsters' => 0,
            'player_id' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'rewards' => $message,
        ]);

        // remove the token
        Monster::giveToPlayer(1, $id);
        self::notifyAllPlayers("removeMonsterToken", '', [
            'playerId' => $playerId,
            'monster' => $monster,
        ]);

        $stateId = intval($this->gamestate->state_id());

        if ($councilStack) {
            $council = Ally::getCouncilSlots();
            $canTake = 0;
            foreach ($council as $faction => $size) {
                if ($size > 0) {
                    if ($this->isKrakenExpansion()) {
                        $guarded = $this->guardedBySentinel('council', $faction);
                        if ($guarded === null || $guarded->playerId == $playerId) {
                            $canTake++;
                        }
                    } else {
                        $canTake++;
                    }
                }
            }
            
            if ($canTake == 0) {
                throw new BgaUserException(_("No available council stack"));
            }
            
            $this->globals->set(STATE_AFTER_CHOOSE_COUNCIL_STACK_MONSTER_TOKEN, $stateId);
            $this->gamestate->jumpToState(ST_PLAYER_CHOOSE_COUNCIL_STACK_MONSTER_TOKEN);
            return;
        }

        $this->gamestate->jumpToState($stateId);
    }

    function actChooseCouncilStackMonsterToken(int $faction) {
        $this->checkAction('actChooseCouncilStackMonsterToken');

        $player_id = intval($this->getActivePlayerId());

        if ($this->isKrakenExpansion()) {
            $guarded = $this->guardedBySentinel('council', $faction);
            if ($guarded !== null) {
                if ($guarded->playerId == $player_id) {
                    $this->discardSentinel($guarded->lordId);
                } else {
                    throw new BgaVisibleSystemException( "That stack is not available (reserved by a sentinel)." );
                } 
            }
        }

        $allies = Ally::drawCouncilSlot( $faction, $player_id );
        if (count($allies) == 0) {
            throw new BgaVisibleSystemException( "There are no Allies of that faction in the council." );
        }
        
        $this->incStat( 1, "times_council", $player_id );

        // Notification
        $this->notifyAllPlayers( "requestSupport", clienttranslate('${player_name} takes ${num} card(s) from the ${council_name}'), array(
                'faction' => $faction,
                'num' => count($allies),
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'council_name' => array(
                    'log' => '<span style="color:'.$this->factions[$faction]["colour"].'">' . clienttranslate('${faction} council') . '</span>',
                    'args' => array(
                        'faction' => $this->factions[$faction]["ally_name"],
                        'i18n' => ['faction']
                    )
                )
        ) );

        $this->notifyPlayer( $player_id, "requestSupportCards", '', array(
                'faction' => $faction,
                'allies' => $allies,
                'player_id' => $player_id
        ) );

        $this->gamestate->jumpToState($this->globals->get(STATE_AFTER_CHOOSE_COUNCIL_STACK_MONSTER_TOKEN));
    }

    function actEndRevealReward() {
        $this->checkAction('actEndRevealReward');

        $this->gamestate->nextState('next');
    }

}
