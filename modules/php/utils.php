<?php

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function array_identical(array $a1, array $a2) {
        if (count($a1) != count($a2)) {
            return false;
        }
        for ($i=0;$i<count($a1);$i++) {
            if ($a1[$i] != $a2[$i]) {
                return false;
            }
        }
        return true;
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function returnToPrevious() {
        $previous = self::getGameStateValue( "previous_state" );
        $this->gamestate->nextState( "return_$previous" );
    }

    function getPlayerPearls(int $player_id) {
        return self::getUniqueValueFromDB( "SELECT player_pearls FROM player WHERE player_id = $player_id" );
    }

    function getPlayerKeys(int $player_id) {
        return self::getUniqueValueFromDB( "SELECT player_keys FROM player WHERE player_id = $player_id" );
    }

    function incPlayerPearls(int $player_id, int $diff, string $source) {
        self::DbQuery( "UPDATE player SET player_pearls = player_pearls + $diff WHERE player_id = $player_id" );
        $players = self::loadPlayersBasicInfos();
        $message = '';
        $params = array(
                'player_id' => $player_id,
                'player_name' => $players[$player_id]["player_name"],
                'pearls' => $diff,
                'num_pearls' => $diff,
                'source' => $source
        );
        if (strpos($source, "lord_") === 0) {
            $lord_id = str_replace("lord_", "", $source);
            if ($diff > 0) {
                $message = clienttranslate('${player_name} gains ${num_pearls} Pearl(s) from ${lord_name}');
                $params["i18n"] = array('lord_name');
                $params["lord_name"] = $this->lords[$lord_id]["name"];
            } else if ($diff < 0) {
                $message = clienttranslate('${player_name} loses ${num_pearls} Pearl(s) from ${lord_name}');
                $params["i18n"] = array('lord_name');
                $params["lord_name"] = $this->lords[$lord_id]["name"];
            }
        } else if ($source == "explore") {
            $message = clienttranslate('${player_name} gains 1 Pearl for reaching the end of the exploration track');
        } else if ($source == "recruit") {
            $message = clienttranslate('${player_name} gains 2 Pearls for causing the Lord track to refill');
        }
        self::notifyAllPlayers( "diff", $message, $params );
    }

    function incPlayerKeys(int $player_id, int $diff, string $source) {
        self::DbQuery( "UPDATE player SET player_keys = player_keys + $diff WHERE player_id = $player_id" );
        self::notifyAllPlayers( "diff", '', array(
                'player_id' => $player_id,
                'keys' => $diff,
                'source' => $source
        ) );
    }

    function checkAllyDeck() {
        // If the deck is empty, shuffle discard pile
        if (Ally::getDeckSize() == 0) {
            $size = Ally::shuffleDiscard();
            self::notifyAllPlayers( "allyDeckShuffle", clienttranslate('Shuffling the Ally discard pile to form a new deck.'), array(
                    'deck_size' => $size
            ) );
        }
    }

    public function getLordCost( $lord, int $player_id) {
        $cost = $lord["cost"];
        if (Lord::playerHas( 25 , $player_id )) {
            $cost -= 2;
        }
        if (Lord::opponentHas( 1 , $player_id ) && ! Lord::playerProtected( $player_id )) {
            $cost += 2;
        }
        if ($cost < 0)
            $cost = 0;
        return $cost;
    }

    public function updatePlayerScore(int $player_id, bool $final_scoring, bool $log = true, bool $update = true) {
        $affiliated = Ally::getPlayerAffiliated( $player_id );
        $lords = Lord::getPlayerHand( $player_id );
        $locations = Location::getPlayerHand( $player_id );
        $players = self::loadPlayersBasicInfos();

        // Strongest affiliated Ally from each Race
        $affiliated_points = 0;
        $strongest = array();
        foreach ($affiliated as $ally) {
            if (! isset($strongest[$ally["faction"]]) || $strongest[$ally["faction"]] < $ally["value"]) {
                $strongest[$ally["faction"]] = $ally["value"];
            }
        }
        foreach ($strongest as $s) {
            $affiliated_points += $s;
        }
        // if ($final_scoring && $log) {
        // 	self::notifyAllPlayers( "message", '${player_name} scores ${num} points from affiliated Allies', array(
        // 			'num' => $affiliated_points,
        // 			'player_id' => $player_id,
        // 			'player_name' => $players[$player_id]["player_name"],
        // 	) );
        // }

        // Lords (all - regardless of if in Location or not)
        $lord_points = 0;
        $highest_lord = 0;
        foreach ($lords as $l) {
            $lord_points += $l["points"];
            $highest_lord = max($highest_lord, $l["points"]);
        }
        // if ($final_scoring && $log) {
        // 	self::notifyAllPlayers( "message", '${player_name} scores ${num} points from Lords', array(
        // 			'num' => $lord_points,
        // 			'player_id' => $player_id,
        // 			'player_name' => $players[$player_id]["player_name"],
        // 	) );
        // }

        // Monster tokens
        $monster_points = 0;
        if ($final_scoring) {
            // This is secret -- only count at the very end
            $monsters = Monster::getPlayerHand( $player_id );
            foreach ($monsters as $m) {
                $monster_points += $m["value"];
            }
        }
        // if ($final_scoring && $monster_points > 0 && $log) {
        // 	self::notifyAllPlayers( "message", '${player_name} scores ${num} points from Monster tokens', array(
        // 			'num' => $monster_points,
        // 			'player_id' => $player_id,
        // 			'player_name' => $players[$player_id]["player_name"],
        // 	) );
        // }

        // Locations
        $location_points = 0;
        foreach ($locations as $l) {
            if ($l["location_id"] == 9) {
                if ($final_scoring) {
                    // Copy the opponent's best Location
                    $enemy_locations = Location::getAllOpponents( $player_id );
                    $max = 0;
                    $imitate_location = null;
                    foreach ($enemy_locations as $el) {
                        $els = Location::score( $el["location_id"], $lords, $affiliated );
                        if ($els > $max) {
                            $max = $els;
                            $imitate_location = $el;
                        }
                    }
                    if (isset($imitate_location) && $log) {
                        // This is the location we copy (log it!)
                        self::notifyAllPlayers( "message", '${player_name} scores ${num} points from ${location_name} (copying ${copied_location_name})', array(
                                'num' => $max,
                                'player_id' => $player_id,
                                'player_name' => $players[$player_id]["player_name"],
                                'location_name' => $this->locations[$l["location_id"]]["name"],
                                'copied_location_name' => $this->locations[$imitate_location["location_id"]]["name"],
                                'i18n' => array('location_name', 'copied_location_name')
                        ) );
                    }
                    $location_points += $max;
                }
            } else {
                $lscore = Location::score( $l["location_id"], $lords, $affiliated );
                $location_points += $lscore;
                if ($final_scoring && $log) {
                    self::notifyAllPlayers( "message", '${player_name} scores ${num} points from ${location_name}', array(
                            'num' => $lscore,
                            'player_id' => $player_id,
                            'player_name' => $players[$player_id]["player_name"],
                            'location_name' => $this->locations[$l["location_id"]]["name"],
                            'i18n' => array('location_name')
                    ) );
                }
            }
        }

        if ($final_scoring && $log) {
            self::setStat( $monster_points, "points_from_monsters", $player_id );
            self::setStat( $lord_points, "points_from_lords", $player_id );
            self::setStat( $affiliated_points, "points_from_allies", $player_id );
            self::setStat( $location_points, "points_from_locations", $player_id );
        }

        $score = $affiliated_points + $lord_points + $monster_points + $location_points;
        $player_pearls = self::getPlayerPearls( $player_id );

        if ($update) {
            self::DbQuery( "UPDATE player SET player_score=$score, player_score_aux=$player_pearls WHERE player_id=$player_id" );
        }

        $breakdown = array(
                'score' => $score,
                'player_id' => $player_id,
                'pearls' => $player_pearls,
                'highest_lord' => $highest_lord,
                'affiliated_points' => $affiliated_points,
                'lord_points' => $lord_points,
                'monster_points' => $monster_points,
                'location_points' => $location_points,
                'final_scoring' => $final_scoring,
        );
        
        if ($log) {
            self::notifyAllPlayers( "score", '', $breakdown );
        }

        return $breakdown;
    }
}
