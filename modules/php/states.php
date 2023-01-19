<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    function stPreTurn() {
        $player_id = $this->getActivePlayerId();

        // Give them some time
        self::giveExtraTime( $player_id );

        // Set all player Lords to be unused
        Lord::setUnused();
        self::notifyAllPlayers( "refreshLords", '', array() );

        // Reset purchase cost to 1
        self::setGameStateValue( 'purchase_cost', 1 );

        // If the player has The Lordlord, give them a Pearl
        if (Lord::playerHas( 11 , $player_id )) {
            self::incPlayerPearls( $player_id, 1, "lord_11" );
        }

        // Set all players has_purchased to false
        self::DbQuery( "UPDATE player SET player_has_purchased = 0 WHERE 1" );

        // Stats
        self::incStat( 1, "turns_number", $player_id );
        self::incStat( 1, "turns_number" );

        $this->gamestate->nextState( );
    }

    function doFinalScoring() {
        $breakdowns = [];

        $players = self::loadPlayersBasicInfos();
        $max_score = 0;
        foreach ($players as $pid => $p) {
            $breakdowns[$pid] = self::updatePlayerScore( $pid, true, false, false );
            $max_score = max($max_score, $breakdowns[$pid]["score"]);
        }

        // Fetch highest players
        $winning_pearls = NULL;
        $tied_players = 0;
        $tied_on_pearls = true;
        foreach ($players as $pid => $p) {
            if ($breakdowns[$pid]['score'] == $max_score) {
                $tied_players++;
                if (!isset($winning_pearls)) {
                    $winning_pearls = $breakdowns[$pid]["pearls"];
                } else {
                    if ($breakdowns[$pid]["pearls"] != $winning_pearls) {
                        $tied_on_pearls = false;
                        break;
                    }
                }
            }
        }

        if ($tied_on_pearls && $tied_players > 1) {
            // Use max lord instead
            foreach ($players as $pid => $p) {
                $aux = 0;
                if ($breakdowns[$pid]['score'] == $max_score) {
                    $aux = $breakdowns[$pid]["highest_lord"];
                }
                self::DbQuery( "UPDATE player SET player_score_aux=$aux WHERE player_id=$pid" );
            }
        }

        // TODO : In theory there can be multiple...
        $winner_id = intval(self::getUniqueValueFromDB("SELECT player_id FROM player ORDER BY player_score DESC, player_score_aux DESC LIMIT 1"));

        // Send a notification to delay the endGame
        self::notifyAllPlayers( "endGame_scoring", '',
        array(
                'breakdowns' => $breakdowns,
                'winner_ids' => array($winner_id)
        ) );
    }

    function stFinalScoring() {
        $this->doFinalScoring();

        $this->gamestate->nextState( );
    }

    function stPlotAtCourt()
    {
        $player_id = $this->getActivePlayerId();

        // If Lord track is full, or if player has no pearls, or there are no Lords left player must pass.
        if (count(Lord::getSlots()) == 6 || self::getPlayerPearls($player_id) == 0 || Lord::getDeckSize() == 0) {
            $this->gamestate->nextState( 'pass' );
        }
    }

    function stBlackSmokers() {
        if (Location::getDeckSize() == 0) {
            // If no locations in the deck, autopass!
            $this->gamestate->nextState( 'pass' );
        }
    }

    function stMustExplore() {
        $player_id = $this->getActivePlayerId();
        
        $this->explore(false);
    }

    function stMustExploreTake() {
        $player_id = $this->getActivePlayerId();
        
        $this->exploreTake(5, false);
    }

    function stAction() {
        self::checkAllyDeck();
    }

    function stUnusedLords() {
        // if a player must give the kraken, we do this right now!
        $mustSelectNewPlayer = $this->getGlobalVariable(MUST_SELECT_NEW_PLAYER_FOR_KRAKEN) ?? [];
        if (count($mustSelectNewPlayer) > 0) {
            $this->gamestate->nextState('giveKraken');
            return;
        }

        // If the player has no unused Lords, then next!
        $player_id = $this->getActivePlayerId();

        $lords = Lord::getPlayerHand( $player_id );
        $found = false;
        foreach ($lords as $lord) {
            if ($lord["effect"] == Lord::EFFECT_TURN && ! $lord["used"] && ! $lord["turned"] && ! isset($lord["location"])) {
                $found = true;
                break;
            }
        }

        if (! $found) {
            $this->gamestate->nextState( 'pass' );
        }
    }

    function stPrePurchase() {
        $purchase_cost = self::getGameStateValue( 'purchase_cost' );
        $first_player_id = self::getGameStateValue( 'first_player_id' );

        // If the last card is a monster, there is no purchase opportunity
        $slots = Ally::getExploreSlots();
        $ally = end($slots);
        if ($ally['faction'] === NULL) {
            $this->gamestate->changeActivePlayer( $first_player_id );
            $this->gamestate->nextState( 'explore' );
            return;
        }

        // Absolutely must not commit this:
        // $this->gamestate->changeActivePlayer( $first_player_id );
        // $this->gamestate->nextState( 'explore' );
        // return;

        // Go to next player...
        $player_id = self::getActivePlayerId();
        do {
            $player_id = self::getPlayerAfter( $player_id );

            if ($player_id == $first_player_id) {
                // We've gone full circle, back to explore phase!
                $this->gamestate->changeActivePlayer( $player_id );
                $this->gamestate->nextState( 'explore' );
                return;
            }

            $playerPearls = self::getPlayerPearls( $player_id );
            $playerNebulis = $this->isKrakenExpansion() ? $this->getPlayerNebulis($player_id) : 0;
            $player_obj = self::getObjectFromDB( "SELECT player_id id, player_autopass, player_has_purchased FROM player WHERE player_id = " . $player_id );
            $has_purchased = intval($player_obj["player_has_purchased"]);
            $maxPurchase = Lord::playerHas(111, $player_id) ? 2 : 1;

            $autopass = $player_obj["player_autopass"];
            if ($autopass) {
                $values = explode(";", $autopass);
                if (count($values) >= 5) {
                    $faction = intval($ally["faction"]);
                    if (in_array($faction, [0,1,2,3,4]) && $values[$faction] >= $ally["value"]) {
                        # The player wishes to autopass this ally
                        continue;
                    }
                }
            }
            if (($playerPearls + $playerNebulis) >= $purchase_cost && $has_purchased < $maxPurchase) {
                // They have enough money and haven't purchased yet!
                $this->gamestate->changeActivePlayer( $player_id );
                $this->gamestate->nextState( 'purchase' );
                return;
            }
        } while (true);
    }

    function stPreExplore() {
        $first_player_id = self::getGameStateValue( 'first_player_id' );

        // Go back to first player...
        $this->gamestate->changeActivePlayer( $first_player_id );

        $slots = Ally::getExploreSlots();
        
        self::checkAllyDeck();
        
        if (count($slots) == 5) {
            $this->gamestate->nextState( "trackFull" );
        } else {
            $this->gamestate->nextState( "default" );
        }
    }

    function stPreControl() {
        $player_id = intval(self::getActivePlayerId());

        // Shuffle Lords along to the right
        $lords = Lord::moveToRight();
        self::setGameStateValue( 'selected_lord', 0 );

        self::notifyAllPlayers( "moveLordsRight", '', [
            'lords' => $lords,
        ]);

        if (count($lords) <= 2) {
            // If the PP is showing, add PP, and draw new Lords (here)
            self::incPlayerPearls( $player_id, 2, "recruit" );
            $lords = Lord::refill();

            self::notifyAllPlayers( "refillLords", '', [
                'lords' => $lords,
                'deck_size' => Lord::getDeckSize(),
            ]);
        }

        // How many keys does the player have?
        $key_tokens = self::getPlayerKeys( $player_id );
        $lord_keys = Lord::getKeys( $player_id );

        // If the player has 3 keys, they must pick a location...
        if ($key_tokens + $lord_keys >= 3) {
            self::setGameStateValue( "location_drawn_1", -1 );
            self::setGameStateValue( "location_drawn_2", -1 );
            self::setGameStateValue( "location_drawn_3", -1 );
            self::setGameStateValue( "location_drawn_4", -1 );

            $this->gamestate->nextState( "control" );
        } else {
            $this->gamestate->nextState( "next" );
        }
    }

    function stNextPlayer() {
        $player_id = intval(self::getActivePlayerId());
        $transition = "plot";

        $game_ending = self::getGameStateValue( 'game_ending_player' );
        if ($game_ending < 0) {
            $players = self::loadPlayersBasicInfos();
            $ending = false;
            foreach ($players as $pid => $p) {
                $num_lords = count(Lord::getPlayerHand( $pid ));
                if ($num_lords >= 7) {
                    $ending = true;
                    break;
                }
            }

            if (! $ending) {
                if (Lord::getDeckSize() == 0 && count(Lord::getSlots()) < 6) {
                    $ending = true;
                }
            }

            if ($ending) {
                $game_ending = $player_id;
                self::setGameStateValue( 'game_ending_player', $player_id );

                self::notifyAllPlayers( "finalRound", clienttranslate('The end of the game has been triggered by ${player_name}! Each other player gets one more turn.'), array(
                        'player_id' => $player_id,
                        'player_name' => self::getActivePlayerName()
                ) );
            }
        }

        if (self::getGameStateValue( 'extra_turn' ) > 0) {
            self::incGameStateValue( 'extra_turn', -1 );
        } else {
            $next_player = self::getPlayerAfter( $player_id );
            if ($game_ending == $next_player) {
                // Then, each player affiliates the lowest-value Ally of _each_ Race still in their hands
                // ...and we update score for each player
                $players = self::loadPlayersBasicInfos();
                foreach ($players as $pid => $p) {
                    $allies = Ally::getPlayerHand( $pid );
                    $lowest_per_faction = array();
                    foreach ($allies as $ally) {
                        $f = $ally["faction"];
                        if ($f != 10 && (! isset($lowest_per_faction[$f]) || $lowest_per_faction[$f]["value"] > $ally["value"])) {
                            $lowest_per_faction[$f] = $ally;
                        }
                    }
                    // Affiliate these
                    foreach ($lowest_per_faction as $ally) {
                        Ally::affiliate( $pid, $ally["ally_id"] );
                        self::notifyAllPlayers( "affiliate", clienttranslate('${player_name} affiliates ${card_name}'), array(
                                'ally' => $ally,
                                'player_id' => intval($pid),
                                'also_discard' => true,
                                'player_name' => $p["player_name"],
                                'card_name' => array(
                                    'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                                    'args' => array(
                                        'value' => $ally["value"],
                                        'faction' => $this->factions[$ally["faction"]]["ally_name"],
                                        'i18n' => ['faction']
                                    )
                                ),
                        ) );
                    }

                    // Re-calculate scoring
                    self::updatePlayerScore( $pid, true );
                    
                    // Reveal all player's monster
                    self::notifyAllPlayers( "monsterHand", "", array(
                            'player_id' => $pid,
                            'monsters' => Monster::getPlayerHand( $pid )
                    ) );
                }

                $transition = "endGame";
            } else {
                // I don't think we need this if the message exists...
                // Show message when starting the last turn of the game
                // If the next player is the game ending player, this is the last turn
                if (self::getPlayerAfter( $next_player ) == $game_ending) {
                    // self::notifyAllPlayers( "message", clienttranslate('This is the last turn of the game.'), array() );
                }
                $this->activeNextPlayer();
            }
        }
        $this->gamestate->nextState( $transition );
    }

    function stChooseMonsterReward() {
        // TODO : If there is only one reward possible, automatically award it and progress state?
        // ...
    }

    function stAffiliate() {
        $allies = array_values(Ally::getJustSpent());

        // we can't affiliate if we payed only with Krakens
        if ($this->array_every($allies, fn($ally) => $ally['faction'] == 10)) {
            $this->gamestate->nextState('affiliate');
        }
    }

    function stLordEffect() {
        $lord_id = self::getGameStateValue( 'selected_lord' );
        $lord = Lord::get( $lord_id );

        $player_id = self::getActivePlayerId();

        $transition = "done";

        if ($lord['effect'] == Lord::EFFECT_ONCE) {
                switch ($lord['lord_id']) {
                    case 2;
                        // The Jailer - Each of your opponents must discard 1 Ally from their hand.
                        $transition = "lord_2";
                        break;
                    case 3;
                        // The Seeker - Each of your opponents must return 2 Pearls to the Treasury.
                        $players = self::loadPlayersBasicInfos();
                        foreach ($players as $pid => $p) {
                            if ($pid == $player_id) continue;
                            if (Lord::playerProtected( $pid )) continue;
                            $n = self::getPlayerPearls( $pid );
                            self::incPlayerPearls( $pid, -1 * min($n, 2), "lord_3" );
                        }
                        break;
                    case 4;
                        // The Assassin - Each of your opponents must turn 1 Lord of your choice 90°. That Lord counts only for IP.
                        // If at least one opponent has a free Lord
                        $players = self::loadPlayersBasicInfos();
                        foreach ($players as $pid => $p) {
                            if ($pid == $player_id) continue;
                            if (Lord::playerProtected( $pid )) continue;
                            $lords = Lord::getPlayerHand( $pid );
                            foreach ($lords as $lord) {
                                if (! $lord["location"]) {
                                    $transition = "lord_4";
                                    break 2;
                                }
                            }
                        }
                        break;
                    case 7;
                        // The Hunter - Steal a random Monster token from the opponent of your choice.
                        // (if at least one player has a monster token)
                        $players = self::loadPlayersBasicInfos();
                        foreach ($players as $pid => $p) {
                            if ($pid == $player_id) continue;
                            if (Lord::playerProtected( $pid )) continue;
                            $n = Monster::getPlayerHandSize( $pid );
                            if ($n > 0) {
                                $transition = "lord_7";
                                break;
                            }
                        }
                        break;
                    case 9;
                        // The Trader - Gain 3 Pearls.
                        self::incPlayerPearls( $player_id, 3, "lord_9" );
                        break;
                    case 10;
                        // The Peddler - Gain 2 Pearls.
                        self::incPlayerPearls( $player_id, 2, "lord_10" );
                        break;
                    case 13;
                        // The Shopkeeper - Gain 1 Pearl.
                        self::incPlayerPearls( $player_id, 1, "lord_13" );
                        break;
                    case 15;
                        self::incGameStateValue( 'extra_turn', 1 );
                        break;
                    case 16;
                        // The Apprentice - Add 1 stack from council (if any is non-empty)
                        $council = Ally::getCouncilSlots();
                        foreach ($council as $size) {
                            if ($size > 0) {
                                $transition = "lord_16";
                                break;
                            }
                        }
                        break;
                    case 19;
                        // The Illusionist - Swap one of your locations for an available one
                        // 1. Do you have a Location?
                        // 2. Is there at least one available Location?
                        if (count(Location::getPlayerHand($player_id)) > 0) {
                            if (count(Location::getAvailable()) > 0) {
                                $transition = "lord_19";
                            }
                        }
                        break;
                    case 22;
                        // The Corruptor - You may recruit a second Lord for 5 Pearls
                        $pearls = self::getPlayerPearls( $player_id );
                        if ($pearls >= 5) {
                            $transition = "lord_22";
                        }
                        break;
                    case 23;
                        // The Traitor - Discard a free Lord and replace with one from Court
                        // Do you have a free lord?
                        $lords = Lord::getPlayerHand( $player_id );
                        foreach ($lords as $lord) {
                            if (! $lord["location"] && $lord["lord_id"] != 23) {
                                $transition = "lord_23";
                                break;
                            }
                        }
                        break;
                    case 26;
                        // The Schemer - Discard a free Lord and replace with top of deck
                        // Do you have a free lord?
                        $lords = Lord::getPlayerHand( $player_id );
                        foreach ($lords as $lord) {
                            if (! $lord["location"] && $lord["lord_id"] != 26) {
                                $transition = "lord_26";
                                break;
                            }
                        }
                        break;
                    case 33; case 34; case 35;
                        $num_locations = 0;
                        if ($lord['lord_id'] == 33) $num_locations = 2;
                        else if ($lord['lord_id'] == 34) $num_locations = 1;
                        else if ($lord['lord_id'] == 35) $num_locations = 3;
                        // Ambassadors - draw locations, and pick one!
                        // Draw the given number of cards...
                        $new_locations = array();
                        for ($i=1; $i<=4; $i++) {
                            self::setGameStateValue( "location_drawn_$i", -1 );
                        }
                        for ($i=1; $i<=$num_locations; $i++) {
                            $loc = Location::draw();
                            if ($loc) {
                                $new_locations[] = $loc;
                                self::setGameStateValue( "location_drawn_$i", $loc["location_id"] );
                            }
                        }

                        if (count($new_locations) > 0) {
                            // Tell people about the new locations
                            self::notifyAllPlayers( "newLocations", '', array(
                                    'locations' => $new_locations,
                                    'deck_size' => Location::getDeckSize(),
                            ) );

                            $transition = "lord_ambassador";
                        }
                        break;
                    case 104:
                        $playerNebulis = $this->getPlayerNebulis($player_id);
                        if ($playerNebulis > 0) {
                            $opponentsIds = $this->getOpponentsIds($player_id);
                            if ($playerNebulis < count($opponentsIds)) {
                                $transition = "lord_104";
                            } else {
                                foreach ($opponentsIds as $opponentId) {
                                    $this->incPlayerNebulis($opponentId, 1, "lord_104", false);
                                }
                                $this->incPlayerNebulis($player_id, -count($opponentsIds), "lord_104", false);
                                $this->checkNewKrakenOwner();
                            }
                        }
                        break;
                    case 110:
                        // The Inheritor - Gain 5 Pearls.
                        $this->incPlayerPearls( $player_id, 5, "lord_110" );
                        break;
                    case 112:
                        if (Ally::getDiscardSize() > 0) {
                            $transition = "lord_112";
                        }
                        break;
                    case 114:
                        $opponentsIds = $this->getOpponentsIds($player_id);
                        $affiliated = $this->array_some($opponentsIds, fn($opponentId) => count(Ally::getPlayerAffiliated($opponentId)) > 0);
                        if ($affiliated) {
                            $transition = "lord_114";
                        }
                        break;
                    case 116:
                        $lords = Lord::getPlayerHand($player_id);
                        foreach ($lords as $lord) {
                            if ($lord["location"]) {
                                $transition = "lord_116";
                                break;
                            }
                        }
                        break;
                    default;
                        throw new BgaVisibleSystemException( "Not implemented." );
                }
        } else {
            if ($lord['lord_id'] == 5) {
                // Opponents must discard down to 6 cards
                $transition = "lord_5";
            } else if ($lord['lord_id'] == 11) {
                self::incPlayerPearls( $player_id, 1, "lord_11" );
            } else if (in_array($lord['lord_id'], [106, 107, 108])) {
                self::incPlayerNebulis($player_id, 1, "lord_$lord_id" );
                $this->setGameStateValue(AFTER_PLACE_SENTINEL, ST_PRE_CONTROL);
                $this->setSentinel($player_id, $lord_id, 'player', null);
                $transition = "lord_sentinel";
            } 
        }

        self::updatePlayerScore( $player_id, false );
        
        $this->gamestate->nextState( $transition );
    }

    function stLord2() {
        $player_id = self::getActivePlayerId();
        $this->gamestate->setAllPlayersMultiactive();
        // Any player with no Allies in their hand is not active
        $players = self::loadPlayersBasicInfos();
        foreach ($players as $pid => $p) {
            if (Ally::getPlayerHandSize( $pid ) == 0 || $pid == $player_id || Lord::playerProtected( $pid )) {
                $this->gamestate->setPlayerNonMultiactive($pid, 'next');
            }
        }
    }

    function stLord5() {
        $player_id = self::getActivePlayerId();
        $this->gamestate->setAllPlayersMultiactive();
        // Any player with <6 Allies in their hand is not active
        $players = self::loadPlayersBasicInfos();
        foreach ($players as $pid => $p) {
            if (Ally::getPlayerHandSize( $pid ) <= 6 || $pid == $player_id || Lord::playerProtected( $pid )) {
                $this->gamestate->setPlayerNonMultiactive($pid, 'next');
            }
        }
    }

    function stLord114() {
        $player_id = self::getActivePlayerId();
        $faction = intval($this->getGameStateValue(SELECTED_FACTION));

        $opponentsIds = $this->getOpponentsIds($player_id);
        $mustDiscard = [];
        foreach($opponentsIds as $opponentId) {
            if (!Lord::playerProtected($opponentId)) {
                $affiliated = Ally::getPlayerAffiliated($opponentId);
                $affiliatedOfFaction = array_filter($affiliated, fn($ally) => $ally['faction'] == $faction);
                if (count($affiliatedOfFaction) > 0) {
                    $mustDiscard[] = $opponentId;
                }
            }
        }
        
        if (count($mustDiscard) == 0) {
            $this->gamestate->nextState('next');
        } else {
            $this->gamestate->setPlayersMultiactive($mustDiscard, 'next', true);
        }        
    }

    function stCleanupDiscard() {
        $player_id = self::getActivePlayerId();
        if (! Lord::opponentHas( 5 , $player_id ) || Lord::playerProtected( $player_id ) || Ally::getPlayerHandSize( $player_id ) <= 6) {
            // Skip this!
            $this->gamestate->nextState('next');
        }
    }

    function stMartialLaw() {
        $args = $this->argMartialLaw();

        if (!boolval($this->getGameStateValue(MARTIAL_LAW_ACTIVATED)) || $args['diff'] <= 0) {
            $this->gamestate->nextState('next');
        }
    }
    
    function stFillSanctuary() {
        $locationId = intval($this->getGameStateValue(LAST_LOCATION));
        if (count(LootManager::getLootOnLocation($locationId)) == 0) {
            $playerId = self::getActivePlayerId();
            $this->applySearchSanctuary($playerId, $locationId);
        }
    }

  	function stGiveKraken() {
        $this->gamestate->setPlayersMultiactive([intval(self::getGameStateValue(KRAKEN))], 'next', true);
    }
}
