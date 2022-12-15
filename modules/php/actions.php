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
                self::checkAction( 'explore' );
            }
    
            $player_id = self::getActivePlayerId();
            $slots = Ally::getExploreSlots();
    
            // If the row is full, you can't explore.
            // You have to pick the last card.
            if (count($slots) == 5) {
                // Error!
                throw new BgaUserException( self::_("There are already 5 Allies on the explore track. You must take the last one.") );
            }
    
            if (Ally::getDeckSize() == 0) {
                // TODO : Shuffle cards from the dicard back in
                // Error!
                throw new BgaUserException( self::_("There are no cards left in the deck.") );
            }
    
            if (count($slots) > 0) {
                $ally = end($slots);
                if ($ally["faction"] == null && self::getGameStateValue( 'threat_level' ) < 5 && self::checkAction( 'exploreTake', false )) {
                    // Increase the threat track
                    $threat = self::incGameStateValue( 'threat_level', 1 );
                    self::notifyAllPlayers( "setThreat", '', array(
                        'threat' => $threat
                    ) );
                }
            }
    
            // Remember whose turn to return to if a player purchases the ally
            self::setGameStateValue( 'first_player_id', $player_id );
    
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
            $players = self::loadPlayersBasicInfos();
            self::notifyAllPlayers( "explore", $log, array(
                'player_id' => $player_id,
                'player_name' => $players[$player_id]["player_name"],
                'ally' => $ally,
                'deck_size' => Ally::getDeckSize(),
                'card_name' => $card_name
            ) );
    
            // Go to other players to see if they want to buy the card...
            $this->gamestate->nextState( "explore" );
        }
    
            function exploreTake(int $slot, bool $fromRequest = true )
        {
            // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
            if ($fromRequest) {
                self::checkAction( 'exploreTake' );
            }
    
                    $player_id = self::getActivePlayerId();
    
                    // This must be the last ally in the track
                    $slots = Ally::getExploreSlots();
                    if ($slot != count($slots)) {
                        throw new BgaUserException( self::_("You can only take the last card in the explore track.") );
                    }
    
                    // If it's the last slot, you also gain a pearl
                    if ($slot == 5) {
                        self::incPlayerPearls( $player_id, 1, "explore" );
                    }
    
                    $ally = end($slots);
    
                    if ($ally['faction'] === NULL) {
                        // If it's a monster, go through the monster rigmarole
                        $this->gamestate->nextState( "exploreTakeMonster" );
                    } else {
                        // Otherwise, add it to your hand
                        self::DbQuery( "UPDATE ally SET place = ".($player_id * -1)." WHERE ally_id = " . $ally["ally_id"] );
                        $this->gamestate->nextState( "exploreTakeAlly" );
                    }
    
                    // If you have the Ship Master, you gain extra Pearls
                    if (Lord::playerHas( 8, $player_id )) {
                        $factions = array();
                        foreach ($slots as $s) {
                            if ($s["ally_id"] == $ally["ally_id"]) continue;
                            if ($s["faction"] === NULL) continue;
                            $factions[$s["faction"]] = 1;
                        }
                        if (count($factions) > 0) {
                            self::incPlayerPearls( $player_id, count($factions), "lord_8" );
                        }
                    }
    
                    // Move each ally to the appropriate council stack and discard monster allies
                    self::DbQuery( "UPDATE ally SET place = 6 WHERE faction IS NOT NULL AND place >= 1 AND place <= 5");
                    self::DbQuery( "UPDATE ally SET place = 10 WHERE faction IS NULL AND place >= 1");
    
                    // Notification
                    $players = self::loadPlayersBasicInfos();
                    if ($ally['faction'] !== NULL) {
                        self::notifyAllPlayers( "exploreTake", clienttranslate('${player_name} takes ${card_name}'), array(
                                'ally' => $ally,
                                'slot' => $slot,
                                'player_id' => $player_id,
                                'player_name' => $players[$player_id]["player_name"],
                                'card_name' => array(
                                    'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                                    'args' => array(
                                        'value' => $ally["value"],
                                        'faction' => $this->factions[$ally["faction"]]["ally_name"],
                                        'i18n' => ['faction']
                                    )
                                ),
                        ) );
                    } else {
                        self::notifyAllPlayers( "exploreTake", clienttranslate('${player_name} fights a Monster'), array(
                                'ally' => $ally,
                                'slot' => $slot,
                                'player_id' => $player_id,
                                'player_name' => $players[$player_id]["player_name"],
                        ));
                    }
        }
    
            function recruit(int $lord_id )
            {
                    // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
                    self::checkAction( 'recruit' );
    
                    $player_id = self::getActivePlayerId();
    
                    // Confirm the chosen lord is in the display...
                    $lord = Lord::getInTrack( $lord_id );
                    if ($lord == null) {
                        throw new BgaVisibleSystemException( "That Lord is not available." );
                    }
    
                    $state = $this->gamestate->state();
                    if ($state['name'] == 'lord21') {
                        // If there are no lords in the deck, you can't do this...
                        if (Lord::getDeckSize() == 0) {
                            throw new BgaUserException( self::_("There are no Lords left in the deck.") );
                        }
                        
                        // Discard the Lord, and replace with a new one!
                        $new_lord = Lord::putRandom( $lord["place"] );
                        Lord::discard( $lord["lord_id"] );
    
                        // Use Lord
                        Lord::use( 21 );
                        self::notifyPlayer( $player_id, "useLord", '', array(
                                'lord_id' => 21
                        ) );
    
                        // Notify new Lord
                        self::notifyAllPlayers( "plot", clienttranslate('${player_name} replaces ${old_lord_name} with ${new_lord_name} using ${lord_name}'), array(
                                'lord' => $new_lord,
                                'old_lord' => $lord,
                                'player_id' => $player_id,
                                'player_name' => self::getActivePlayerName(),
                                'pearls' => 0,
                                'deck_size' => Lord::getDeckSize(),
                                'lord_name' => $this->lords[21]["name"],
                                'old_lord_name' => $this->lords[$lord["lord_id"]]["name"],
                                'new_lord_name' => $this->lords[$new_lord["lord_id"]]["name"],
                                "i18n" => array('lord_name', 'old_lord_name', 'new_lord_name'),
                ) );
    
                        self::returnToPrevious();
                        return;
                    }
    
                    // Confirm the player _can_ afford the lord
                    $pearls = self::getPlayerPearls( $player_id );
                    
                    if ($state['name'] == 'lord23b') {
                        Lord::giveToPlayer( $lord_id, $player_id );
                        self::notifyAllPlayers( "recruit", clienttranslate('${player_name} recruits ${lord_name} using ${lord_name2}'), array(
                                'lord' => $lord,
                                'player_id' => $player_id,
                                'player_name' => self::getActivePlayerName(),
                                "i18n" => array('lord_name', 'lord_name2'),
                                "lord_name" => $this->lords[$lord_id]["name"],
                                "lord_name2" => $this->lords[23]["name"],
                        ) );
                    } else if ($state['name'] == 'lord22') {
                        // You only need 5 pearls
                        if ($pearls < 5)
                            throw new BgaUserException( self::_("You cannot afford that Lord.") );
    
                        // Spend 5 pearls, and give the player the Lord straight away
                        self::DbQuery( "UPDATE player SET player_pearls = player_pearls - 5 WHERE player_id = " . $player_id );
                        Lord::giveToPlayer( $lord_id, $player_id );
                        self::notifyAllPlayers( "recruit", clienttranslate('${player_name} recruits ${lord_name} with ${spent_pearls} Pearls'), array(
                                'lord' => $lord,
                                'spent_allies' => array(),
                                'spent_pearls' => 5,
                                'player_id' => $player_id,
                                'player_name' => self::getActivePlayerName(),
                                "i18n" => array('lord_name'),
                                "lord_name" => $this->lords[$lord_id]["name"],
                        ) );
                    } else {
                        $hand = Ally::getPlayerHand( $player_id );
                        
                        $canAffordLord = self::canAffordLord($player_id, $hand, $pearls, $lord);
    
                        if (! $canAffordLord) {
                            throw new BgaUserException( self::_("You cannot afford that Lord.") );
                        }
                    }
    
                    self::setGameStateValue( 'selected_lord', $lord_id );
    
                    $this->gamestate->nextState( "recruit" );
        }
        
        function combinations(array $in_values, int $number) {
            $values = $in_values;
            $result = array();
            
            if (count($values) >= $number && $number > 0) {
                foreach ($values as $k => $v) {
                    # Remove values and find combinations of v + combinations of 
                    unset($values[$k]);
                    
                    if ($number == 1) {
                        $cs = array($v);
                    } else {
                        $cs = self::combinations($values, $number - 1);
                        # Add v to all the results
                        foreach ($cs as $k => $c) {
                            $cs[$k] = $cs[$k] + $v;
                        }
                    }
                    
                    $result = array_merge($result, $cs);
                }
            }
            
            return $result;
        }
        
        function hasCombination(array $values, int $number, int $required) {
            $combinations = self::combinations($values, $number);
            foreach ($combinations as $c) {
                if ($c >= $required) {
                    return true;
                }
            }
            return false;
        }
        
        function canAffordLord(int $player_id, array $hand, int $pearls, $lord) {
            $potentialFound = false;
            
            $hasDiplomat = Lord::playerHas( 24 , $player_id );
            $cost = self::getLordCost( $lord, $player_id );
            $requiredDiversity = $lord["diversity"];
            
            $diversity = array();
            foreach ($hand as $ally) {
                if (! isset($diversity[$ally["faction"]])) {
                    $diversity[$ally["faction"]] = 0;
                }
                $diversity[$ally["faction"]] += $ally["value"];
            }
            //throw new BgaUserException( self::_(join(", ", array_keys($diversity)) . " : " . join(", ", array_values($diversity))) );
            $potentialFound = true;
            
            if (count($diversity) < $requiredDiversity) {
                // Total diversity of hand...
                $potentialFound = false;
            } else if (isset($lord["faction"]) && ! $hasDiplomat && ! isset($diversity[$lord["faction"]])) {
                // Required faction
                $potentialFound = false;
            } else {
                // Can you get the required value?
                $cost -= self::getPlayerPearls( $player_id );
                if ($hasDiplomat || ! isset($lord["faction"]) || $requiredDiversity == 5) {
                    // Using any $requiredDiversity different groups, can you get the value required?
                    $values = array_values($diversity);
                    if (! self::hasCombination($values, $requiredDiversity, $cost)) {
                        $potentialFound = false;
                    }
                } else {
                    // Using n different groups, can you get the value required?
                    $cost -= $diversity[$lord["faction"]];
                    $requiredDiversity -= 1;
                    if ($requiredDiversity > 0 || $cost > 0) {
                        unset($diversity[$lord["faction"]]);
                        $values = array_values($diversity);
                        if (! self::hasCombination($values, $requiredDiversity, $cost)) {
                            $potentialFound = false;
                        }
                    }
                }
            }
            
            return $potentialFound;
        }
    
            function affiliate(int $ally_id ) {
                self::checkAction( 'affiliate' );
    
                $player_id = self::getActivePlayerId();
    
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
    
                $lord_id = self::getGameStateValue( 'selected_lord' );
                if (($lord_id == 20 || ! Lord::playerHas( 20 , $player_id )) && $found['value'] != $min) {
                    throw new BgaVisibleSystemException( "You cannot affiliate that Ally (it does not have the lowest value)." );
                }
    
                Ally::affiliate( $player_id, $found["ally_id"]);
    
                // Notify all
                self::notifyAllPlayers( "affiliate", clienttranslate('${player_name} affiliates ${card_name}'), array(
                        'ally' => $found,
                        'player_id' => $player_id,
                        'player_name' => self::getActivePlayerName(),
                        'card_name' => array(
                            'log' => '<span style="color:'.$this->factions[$found["faction"]]["colour"].'">${value} ${faction}</span>',
                            'args' => array(
                                'value' => $found["value"],
                                'faction' => $this->factions[$found["faction"]]["ally_name"],
                                'i18n' => ['faction']
                            )
                        ),
                ) );
    
                self::updatePlayerScore( $player_id, false );
    
                // Next state: Deal with ONCE effect of the last lord...
                $this->gamestate->nextState( 'affiliate' );
            }
    
            function chooseReward(int $option ) {
                self::checkAction( 'chooseReward' );
    
                $player_id = self::getActivePlayerId();
                $rewards = self::argChooseMonsterReward()['rewards'];
    
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
                    self::DbQuery( "UPDATE player SET player_pearls = player_pearls + $pearls, player_keys = player_keys + $keys WHERE player_id = " . $player_id );
                }
    
                // Move the threat back to 0
                self::setGameStateValue( 'threat_level', 0 );
    
                self::notifyAllPlayers( "monsterReward", clienttranslate('${player_name} earns ${rewards} for defeating a Monster'), array(
                        'keys' => $keys,
                        'pearls' => $pearls,
                        'monsters' => count($monsters),
                        'player_id' => $player_id,
                        'player_name' => self::getActivePlayerName(),
                        'rewards' => $message
                ) );
    
                self::notifyPlayer( $player_id, "monsterTokens", '', array(
                        'monsters' => $monsters
                ) );
    
                $this->gamestate->nextState( "next" );
            }
    
            function purchase( )
            {
                    // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
                    self::checkAction( 'purchase' );
    
                    $player_id = self::getActivePlayerId();
    
                    // Do you have enough pearls?
                    // Have you already purchased a card?
                    $first_player_id = self::getGameStateValue( 'first_player_id' );
                    $purchase_cost = self::getGameStateValue( 'purchase_cost' );
                    $player_pearls = self::getPlayerPearls( $player_id );
                    $has_purchased = self::getUniqueValueFromDB( "SELECT player_has_purchased FROM player WHERE player_id = " . $player_id );
                    if ($player_pearls < $purchase_cost) {
                        throw new BgaVisibleSystemException( "You don't have enough Pearls. You must pass." );
                    }
                    if ($has_purchased) {
                        throw new BgaVisibleSystemException( "You have already purchased a card. You must pass." );
                    }
    
                    // Remove the pearls.
                    self::DbQuery( "UPDATE player SET player_has_purchased = 1, player_pearls = player_pearls - ".$purchase_cost." WHERE player_id = " . $player_id );
                    self::DbQuery( "UPDATE player SET player_pearls = player_pearls + ".$purchase_cost." WHERE player_id = " . $first_player_id );
                    self::incGameStateValue( 'purchase_cost', 1 );
    
                    // Add the card to your hand
                    $slots = Ally::getExploreSlots();
                    $ally = end($slots);
                    self::DbQuery( "UPDATE ally SET place = ".($player_id * -1)." WHERE ally_id = " . $ally["ally_id"] );
    
                    // Notify that the card has gone to that player
                    $players = self::loadPlayersBasicInfos();
                    self::notifyAllPlayers( "purchase", clienttranslate('${player_name} purchases ${card_name} for ${cost} Pearl(s)'), array(
                            'ally' => $ally,
                            'slot' => $ally["place"],
                            'cost' => $purchase_cost,
                            'player_id' => $player_id,
                            'player_name' => $players[$player_id]["player_name"],
                            'first_player_id' => $first_player_id,
                            'card_name' => array(
                                'log' => '<span style="color:'.$this->factions[$ally["faction"]]["colour"].'">${value} ${faction}</span>',
                                'args' => array(
                                    'value' => $ally["value"],
                                    'faction' => $this->factions[$ally["faction"]]["ally_name"],
                                    'i18n' => ['faction']
                                )
                            ),
                    ) );
                    
                    self::incStat( $purchase_cost, "pearls_spent_purchasing_allies", $player_id );
    
                    // Go back to the first player's explore action...
                    $this->gamestate->nextState( "purchase" );
        }
    
            function pass( )
        {
                    self::checkAction( 'pass' );
    
                    // Now... to find the right transition ;)
                    $state = $this->gamestate->state();
                    if (isset($state["transitions"]["pass"])) {
                        $this->gamestate->nextState( "pass" );
                    } else {
                        self::returnToPrevious();
                    }
        }
    
            function pay(array $ally_ids )
            {
                    // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
                    self::checkAction( 'pay' );
    
                    $player_id = self::getActivePlayerId();
                    $lord_id = self::getGameStateValue( 'selected_lord' );
                    $lord = Lord::getInTrack( $lord_id );
                    $ally_ids = array_unique($ally_ids);
    
                    // Do you have these cards in your hand? (+ remove them if you do)
                    $allies = Ally::removeCardsFromHand( $player_id, $ally_ids );
    
                    // Do they satisfy diversity requirements?
                    $r = Ally::getDiversityAndValue( $allies, $lord['faction'] );
                    $shortfall = self::getLordCost($lord, $player_id) - $r['value'];
                    $pearls = self::getPlayerPearls( $player_id );
                    $hasDiplomat = Lord::playerHas( 24 , $player_id );
    
                    if (!$hasDiplomat && !$r['includesRequired'])
                        throw new BgaUserException( self::_("You must include an Ally of the Lord's faction.") );
                    if ($r['diversity'] != $lord['diversity'])
                        throw new BgaUserException( sprintf(self::_("You must use exactly %d different faction(s)."), $lord['diversity']) );
                    if ($shortfall > $pearls)
                        throw new BgaUserException( self::_("You do not have enough Pearls to make up the shortfall.") );
    
                    // Are there any superfluous cards?
                    if ($shortfall < 0) {
                        $surplus = -1 * $shortfall;
                        // Do any cards have a value lower than the surplus?
                        // Also, of a faction which is already represented
                        foreach ($allies as $k => $ally) {
                            if ($ally['value'] <= $surplus) {
                                // Is this faction represented elsewhere?
                                foreach ($allies as $k2 => $ally2) {
                                    if ($k == $k2) continue;
                                    if ($ally2['faction'] == $ally['faction'])
                                        throw new BgaUserException( self::_("You cannot use superfluous cards to purchase a Lord.") );
                                }
                            }
                        }
                    }
    
                    // Pay pearls (if shortfall positive)
                    if ($shortfall > 0) {
                        self::DbQuery( "UPDATE player SET player_pearls = player_pearls - $shortfall WHERE player_id = " . $player_id );
                    } else {
                        $shortfall = 0;
                    }
    
                    // Add the lord to your board!
                    Lord::giveToPlayer( $lord_id, $player_id );
    
                    $message = clienttranslate('${player_name} recruits ${lord_name} with ${num_allies} Allies and ${spent_pearls} Pearl(s)');
                    if ($shortfall == 0) {
                        $message = clienttranslate('${player_name} recruits ${lord_name} with ${num_allies} Allies');
                    }
    
                    self::notifyAllPlayers( "recruit", $message, array(
                            'lord' => $lord,
                            'spent_allies' => array_values($allies),
                            'spent_pearls' => $shortfall,
                            'player_id' => $player_id,
                            'player_name' => self::getActivePlayerName(),
                            "i18n" => array('lord_name'),
                            "lord_name" => $this->lords[$lord_id]["name"],
                            'num_allies' => count($allies),
                    ) );
    
                    $this->gamestate->nextState( "pay" );
        }
    
            function requestSupport( $faction )
        {
            // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
            self::checkAction( 'requestSupport' );
    
                    $player_id = self::getActivePlayerId();
    
                    $state = $this->gamestate->state();
                    if ($state['name'] == 'lord17') {
                        // You can discard a stack
                        $num = Ally::discardCouncilSlot( $faction );
    
                        if ($num == 0) {
                            throw new BgaVisibleSystemException( "You cannot discard an empty stack." );
                        }
    
                        // Use Lord
                        Lord::use( 17 );
                        self::notifyPlayer( $player_id, "useLord", '', array(
                                'lord_id' => 17
                        ) );
    
                        self::notifyAllPlayers( "discardCouncil", clienttranslate('${player_name} discards ${num} card(s) from the ${council_name} with ${lord_name}'), array(
                                'num' => $num,
                                'player_id' => $player_id,
                                'faction' => $faction,
                                'player_name' => self::getActivePlayerName(),
                                "i18n" => array('lord_name'),
                                "lord_name" => $this->lords[17]["name"],
                                'council_name' => array(
                                    'log' => '<span style="color:'.$this->factions[$faction]["colour"].'">' . clienttranslate('${faction} council') . '</span>',
                                    'args' => array(
                                        'faction' => $this->factions[$faction]["ally_name"],
                                        'i18n' => ['faction']
                                    )
                                )
                ) );
    
                        self::returnToPrevious();
                        return;
                    }
    
                    $allies = Ally::drawCouncilSlot( $faction, $player_id );
                    if (count($allies) == 0) {
                        throw new BgaVisibleSystemException( "There are no Allies of that faction in the council." );
                    }
                    
                    self::incStat( 1, "times_council", $player_id );
    
                    // Notification
                    self::notifyAllPlayers( "requestSupport", clienttranslate('${player_name} takes ${num} card(s) from the ${council_name}'), array(
                            'faction' => $faction,
                            'num' => count($allies),
                            'player_id' => $player_id,
                            'player_name' => self::getActivePlayerName(),
                            'council_name' => array(
                                'log' => '<span style="color:'.$this->factions[$faction]["colour"].'">' . clienttranslate('${faction} council') . '</span>',
                                'args' => array(
                                    'faction' => $this->factions[$faction]["ally_name"],
                                    'i18n' => ['faction']
                                )
                            )
                    ) );
    
                    self::notifyPlayer( $player_id, "requestSupportCards", '', array(
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
    
            function plot( )
        {
            // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
            self::checkAction( 'plot' );
    
                    // Spend 1 pearl, draw 1 Lord
                    $player_id = self::getActivePlayerId();
                    $pearls = self::getPlayerPearls( $player_id );
                    if ($pearls < 1) {
                        throw new BgaVisibleSystemException( "You don't have enough Pearls." );
                    }
                    self::DbQuery( "UPDATE player SET player_pearls = player_pearls - 1 WHERE player_id = " . $player_id );
    
                    $lord = Lord::draw( );
    
                    self::incStat( 1, "times_plotted", $player_id );
                    self::notifyAllPlayers( "plot", clienttranslate('${player_name} pays 1 Pearl to reveal a new Lord'), array(
                            'lord' => $lord,
                            'player_id' => $player_id,
                            'player_name' => self::getActivePlayerName(),
                            'pearls' => 1,
                            'deck_size' => Lord::getDeckSize()
            ) );
    
                    $this->gamestate->nextState( "plot" );
        }
    
            function discard(array $ally_ids ) {
                self::checkAction( 'discard' );
    
                $player_id = self::getCurrentPlayerId();
                $hand = Ally::getPlayerHand( $player_id );
                $ally_ids = array_unique($ally_ids);
    
                $state = $this->gamestate->state();
                $source = '';
                if ($state['name'] == 'lord2') {
                    // Discard 1 card
                    $source = "lord_2";
                    if (count($ally_ids) != 1) {
                        throw new BgaUserException( sprintf( self::_("You must discard %d card(s)."), 1 ) );
                    }
                } else if ($state['name'] == 'lord5' || $state['name'] == 'cleanupDiscard' || $state['name'] == 'postpurchaseDiscard') {
                    // Discard until you have 6 cards in hand
                    $source = "lord_5";
                    if (count($hand) - count($ally_ids) != 6) {
                        throw new BgaUserException( sprintf( self::_("You must discard %d card(s)."), count($hand) - 6 ) );
                    }
                } else {
                    throw new BgaVisibleSystemException( "Not implemented." );
                }
    
                $allies_lost = array();
                foreach ($ally_ids as $ally_id) {
                    $found = null;
                    foreach ($hand as $a) {
                        if ($a["ally_id"] == $ally_id) {
                            $found = $a;
                            break;
                        }
                    }
                    if (! isset($found)) {
                        throw new BgaVisibleSystemException( "You cannot discard that Ally (it isn't in your hand)." );
                    }
                    $allies_lost[] = $found;
                    Ally::discard( $ally_id );
                }
    
                // Notify all
                self::notifyAllPlayers( "diff", '', array(
                        'player_id' => $player_id,
                        'allies_lost' => $allies_lost,
                        'source' => $source
                ) );
    
                if ($state['name'] == 'cleanupDiscard' || $state['name'] == 'postpurchaseDiscard') {
                    $this->gamestate->nextState( "next" );
                } else {
                    $this->gamestate->setPlayerNonMultiactive($player_id, 'next');
                }
            }
    
            function chooseMonsterTokens(int $target_player_id ) {
                self::checkAction( 'chooseMonsterTokens' );
    
                $player_id = self::getCurrentPlayerId();
    
                $hand = Monster::getPlayerHand( $target_player_id );
    
                if (count($hand) == 0) {
                    throw new BgaUserException( self::_("That player has no Monster tokens.") );
                }
    
                if (Lord::playerProtected( $target_player_id ))
                    throw new BgaUserException( self::_("That player is protected by The Shaman.") );
    
                // Pick a random Monster and give it to the current player
                $monster = $hand[array_rand($hand)];
                Monster::giveToPlayer( $player_id, $monster["monster_id"] );
    
                // Notify all
                $players = self::loadPlayersBasicInfos();
                foreach ($players as $pid => $p) {
                    if ($pid == $player_id || $pid == $target_player_id) {
                        self::notifyPlayer( $pid, "diff", '', array(
                                'player_id' => $player_id,
                                'monster' => array($monster),
                                'source' => "player_$target_player_id"
                        ) );
                    } else {
                        self::notifyPlayer( $pid, "diff", '', array(
                                'player_id' => $player_id,
                                'monster_count' => 1,
                                'source' => "player_$target_player_id"
                        ) );
                    }
                }
                
                $players = self::loadPlayersBasicInfos();
                self::notifyAllPlayers( "message", clienttranslate('${player_name} steals ${rewards} from ${player_name2}'), array(
                    'player_name2' => $players[$target_player_id]['player_name'],
                    'player_id' => $player_id,
                    'player_name' => self::getActivePlayerName(),
                    'rewards' => '<i class="icon icon-monster"></i>'
            ) );
    
                $this->gamestate->nextState( "next" );
            }
    
            function selectLord(int $lord_id ) {
                self::checkAction( 'selectLord' );
    
                $player_id = self::getCurrentPlayerId();
                $lord = Lord::get( $lord_id );
    
                $state = $this->gamestate->state();
                if ($state["name"] == "lord23") {
                    // Swap a Lord with court
                    if ($lord["place"] != -1 * $player_id) {
                        throw new BgaUserException( self::_("You must select one of your own Lords.") );
                    }
    
                    if ($lord_id == 23) {
                        throw new BgaUserException( self::_("You must choose a different Lord.") );
                    }
    
                    if ($lord["location"]) {
                        throw new BgaVisibleSystemException( "That Lord is not free." );
                    }
    
                    // Discard the Lord
                    Lord::discard( $lord_id );
    
                    self::notifyAllPlayers( "recruit", clienttranslate('${player_name} discards ${lord_name} for ${lord_name2}'), array(
                            'spent_lords' => array($lord),
                            'player_id' => $player_id,
                            'player_name' => self::getActivePlayerName(),
                            "i18n" => array('lord_name', 'lord_name2'),
                            'lord_name' => $this->lords[$lord_id]["name"],
                            "lord_name2" => $this->lords[23]["name"],
                    ) );
    
                    $this->gamestate->nextState( "selectLord" );
                } else if ($state["name"] == "lord26") {
                    // Swap a Lord with topdeck
                    if ($lord["place"] != -1 * $player_id) {
                        throw new BgaUserException( self::_("You must select one of your own Lords.") );
                    }
    
                    if ($lord_id == 26) {
                        throw new BgaUserException( self::_("You must choose a different Lord.") );
                    }
    
                    if ($lord["location"]) {
                        throw new BgaVisibleSystemException( "That Lord is not free." );
                    }
    
                    // Discard the Lord, and give the player a new one!
                    Lord::discard( $lord_id );
                    $lord2 = Lord::injectTextSingle(Abyss::getObject( "SELECT * FROM lord WHERE place = 0 ORDER BY RAND() LIMIT 1" ));
                    Lord::giveToPlayer( $lord2["lord_id"], $player_id );
    
                    self::notifyAllPlayers( "recruit", clienttranslate('${player_name} swaps ${lord_name} for ${lord_name2} using ${lord_name3}'), array(
                            'lord' => $lord2,
                            'spent_lords' => array($lord),
                            'player_id' => $player_id,
                            'player_name' => self::getActivePlayerName(),
                            "i18n" => array('lord_name', 'lord_name2', 'lord_name3'),
                            'lord_name' => $this->lords[$lord_id]["name"],
                            "lord_name2" => $this->lords[$lord2["lord_id"]]["name"],
                            "lord_name3" => $this->lords[26]["name"],
                    ) );
    
                    self::setGameStateValue( 'selected_lord', $lord2["lord_id"] );
    
                    $this->gamestate->nextState( "selectLord" );
                } else if ($state["name"] == "lord4") {
                    if ($lord["place"] == (-1 * $player_id)) {
                        throw new BgaUserException( self::_("You cannot disable one of your own Lords.") );
                    }
    
                    if (Lord::playerProtected( -1 * $lord["place"] )) {
                        throw new BgaUserException( self::_("That player is protected by The Shaman.") );
                    }
    
                    if ($lord["turned"]) {
                        throw new BgaUserException( self::_("That Lord has already been disabled.") );
                    }
    
                    if ($lord["location"]) {
                        throw new BgaVisibleSystemException( "That Lord is not free." );
                    }
    
                    $players = self::loadPlayersBasicInfos();
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
                                throw new BgaUserException( self::_("You have already disabled a Lord for that player.") );
                            // Disable the Lord!
                            $found = true;
                            Lord::disable( $lord_id );
                            self::notifyAllPlayers( "disable", clienttranslate('${player_name} disables ${lord_name} using ${lord_name2}'), array(
                                    'lord_id' => $lord_id,
                                    'player_id' => $player_id,
                                    'player_name' => self::getActivePlayerName(),
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
    
            function lordEffect(int $lord_id ) {
                self::checkAction( 'lordEffect' );
    
                $player_id = self::getCurrentPlayerId();
                $lord = Lord::get( $lord_id );
    
                // Must be an unused, unturned, free Lord, owned by the player with a TURN effect...
                if ($lord["place"] != -1 * $player_id)
                    throw new BgaUserException( self::_("You do not own that Lord.") );
                if ($lord["used"])
                    throw new BgaUserException( self::_("You have already used that Lord.") );
                if ($lord["turned"])
                    throw new BgaUserException( self::_("That Lord has been disabled by the Assassin.") );
                if (isset($lord["location"]))
                    throw new BgaUserException( self::_("That Lord is not free.") );
                if ($lord["effect"] != Lord::EFFECT_TURN)
                    throw new BgaUserException( self::_("That Lord does not have an activated ability.") );
    
                // Times when you can't use a Lord
                if ($lord_id == 21 && Lord::getDeckSize() == 0) {
                    // Opportunist - can't use if no Lords in the deck
                    throw new BgaUserException( self::_("There are no Lords left in the deck.") );
                } else if ($lord_id == 12 && Ally::getPlayerHandSize( $player_id ) == 0) {
                    // Slaver - can't use if no cards in hand
                    throw new BgaUserException( self::_("You have no Ally cards in your hand.") );
                } else if ($lord_id == 17 && max(Ally::getCouncilSlots()) == 0) {
                    // Oracle - can't use if no council stacks
                    throw new BgaUserException( self::_("There are no Council stacks to discard.") );
                }
    
                $state = $this->gamestate->state();
    
                self::setGameStateValue( "previous_state", $this->state_ids[$state["name"]] );
    
                $this->gamestate->nextState( "lord_$lord[lord_id]" );
            }
    
            function drawLocations(int $num ) {
                self::checkAction( 'drawLocations' );
    
                $player_id = self::getCurrentPlayerId();
    
                if ($num <= 0 || $num > 4)
                    throw new BgaVisibleSystemException( "You must draw 1-4 cards." );
    
                if ($num > Location::getDeckSize()) {
                    throw new BgaUserException( self::_("There are not enough Locations left in the deck.") );
                }
    
                // Draw the given number of cards...
                $new_locations = array();
                for ($i=1; $i<=$num; $i++) {
                    $loc = Location::draw();
                    $new_locations[] = $loc;
                    self::setGameStateValue( "location_drawn_$i", $loc["location_id"] );
                }
    
                // Tell people about the new locations
                self::notifyAllPlayers( "newLocations", '', array(
                        'locations' => $new_locations,
                        'deck_size' => Location::getDeckSize(),
                ) );
    
                $this->gamestate->nextState( "drawLocations" );
            }
    
            function chooseLocation(int $location_id, array $lord_ids ) {
                self::checkAction( 'chooseLocation' );
    
                $player_id = self::getCurrentPlayerId();
                $location = Location::get($location_id);
    
                if (!isset($location)) {
                    throw new BgaVisibleSystemException( "Location not found." );
                }
    
                $state = $this->gamestate->state();
                $trapped_lords = array();
                if ($state["name"] == "lord19") {
                    // You must choose a Location you own
                    if ($location["place"] != -1 * $player_id) {
                        throw new BgaUserException( self::_("You must choose a Location you own first.") );
                    }
    
                    self::setGameStateValue( "temp_value", $location["location_id"] );
    
                    $this->gamestate->nextState( "chooseLocation" );
                    return;
                } else if ($state["name"] == "lord19b") {
                    // Swap locations!
                    if ($location["place"] != 1) {
                        throw new BgaUserException( self::_("You must select an available Location.") );
                    }
    
                    $old_location_id = self::getGameStateValue( "temp_value" );
    
                    // Move any Lords to the new Location
                    self::DbQuery( "UPDATE lord SET location = $location_id WHERE location = $old_location_id" );
    
                    // Move the old Location to the available ones
                    self::DbQuery( "UPDATE location SET place = 1 WHERE location_id = $old_location_id" );
    
                    $trapped_lords = Lord::injectText(self::getCollectionFromDb( "SELECT * FROM lord WHERE location = $location_id" ));
    
                    self::notifyAllPlayers( "loseLocation", '', array(
                            'location_id' => $old_location_id,
                            'player_id' => $player_id
                    ) );
                    self::notifyAllPlayers( "newLocations", '', array(
                            'locations' => array(Location::get($old_location_id)),
                            'deck_size' => Location::getDeckSize(),
                    ) );
                } else if ($state["name"] == "locationEffectBlackSmokers") {
                    // You must pick a Location from the deck
                    if ($location["place"] != 0) {
                        throw new BgaUserException( self::_("You must choose a Location from the deck.") );
                    }
    
                    // Move any Lords to the new Location
                    self::DbQuery( "UPDATE lord SET location = $location_id WHERE location = 10" );
    
                    // Discard the old Location
                    self::DbQuery( "UPDATE location SET place = 10 WHERE location_id = 10" );
    
                    $trapped_lords = Lord::injectText(self::getCollectionFromDb( "SELECT * FROM lord WHERE location = $location_id" ));
    
                    self::notifyAllPlayers( "loseLocation", '', array(
                            'location_id' => 10,
                            'player_id' => $player_id
                    ) );
                } else {
                    // If location_drawn_1-4 are not -1, then you must pick one of those
                    $available_locations = self::argControlPostDraw()["location_ids"];
                    if (count($available_locations) > 0 && ! in_array($location_id, $available_locations)) {
                        throw new BgaUserException( self::_("You must choose one of the Locations you just drew.") );
                    }
    
                    if ($location["place"] != 1) {
                        throw new BgaUserException( self::_("You must select an available Location.") );
                    }
    
                    $lords = Lord::getPlayerHand( $player_id );
                    $ambassador = false;
                    foreach ($lords as $lord) {
                        if ($lord["turned"] || isset($lord["location"])) continue;
                        if ($lord["lord_id"] == 33 || $lord["lord_id"] == 34 || $lord["lord_id"] == 35) {
                            // You must select an ambassador if you have one!
                            if (count($lord_ids) != 1 || ! in_array($lord["lord_id"], $lord_ids)) {
                                throw new BgaUserException( self::_("You must choose a Location for your Ambassador.") );
                            }
                            $ambassador = true;
                        }
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
                            throw new BgaUserException( self::_("You cannot use Lords disabled by the Assassin.") );
                        }
                        if ($lord["keys"] == 0 && ! $ambassador) {
                            throw new BgaUserException( self::_("You can only use Lords with keys to control a Location.") );
                        }
                        $keys_from_lords += +$lord["keys"];
    
                        // Lock Lord into Location (we'll revert later if this is premature)
                        self::DbQuery( "UPDATE lord SET location = $location_id WHERE lord_id = $lord_id" );
                    }
    
                    if ($keys_from_lords > 3 && ! $ambassador)
                        throw new BgaUserException( self::_("You can not use superfluous Lords to control a Location.") );
    
                    $key_tokens_needed = 3 - $keys_from_lords;
    
                    if ($key_tokens_needed > 0 && ! $ambassador) {
                        $player_keys = self::getPlayerKeys( $player_id );
                        if ($player_keys < $key_tokens_needed) {
                            throw new BgaUserException( self::_("You do not have enough Key tokens. You must select additional Lords.") );
                        }
                        self::incPlayerKeys( $player_id, -1 * $key_tokens_needed, "location_$location_id" );
                    }
                }
    
                // Give Location to Player
                self::DbQuery( "UPDATE location SET place = -$player_id WHERE location_id = $location_id" );
    
                self::notifyAllPlayers( "control", clienttranslate('${player_name} takes ${location_name}'), array(
                        'location' => $location,
                        'lords' => $trapped_lords,
                        'player_id' => $player_id,
                        'player_name' => self::getActivePlayerName(),
                        'location_name' => $this->locations[$location_id]["name"],
                        'i18n' => array('location_name'),
                ) );
    
                self::updatePlayerScore( $player_id, false );
    
                if ($location["location_id"] == 10) {
                    $this->gamestate->nextState( "locationEffectBlackSmokers" );
                } else {
                    $this->gamestate->nextState( "chooseLocation" );
                }
            }
    
            function selectAlly(int $ally_id ) {
                self::checkAction( 'selectAlly' );
    
                $player_id = self::getCurrentPlayerId();
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
                    self::notifyPlayer( $player_id, "useLord", '', array(
                            'lord_id' => 12
                    ) );
    
                    // Notify all
                    self::notifyAllPlayers( "diff", '', array(
                            'player_id' => $player_id,
                            'allies_lost' => $allies_lost,
                            'source' => $source
                    ) );
                    self::incPlayerPearls( $player_id, 2, "lord_12" );
    
                    self::returnToPrevious();
                    return;
                }
    
                throw new BgaVisibleSystemException( "Not implemented." );
            }
            
            function setAutopass(array $autopass ) {
                $player_id = self::getCurrentPlayerId();
                
                $autopass_string = implode(";", $autopass);
                
                Abyss::DbQuery( "UPDATE player SET player_autopass = '$autopass_string' WHERE player_id = $player_id" );
                
                // $this->gamestate->nextState( 'loopback' );
            }
}
