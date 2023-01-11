<?php

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */
   
    function argAffordableLords() {
		$player_id = self::getActivePlayerId();
		$hand = Ally::getPlayerHand( $player_id );
		$pearls = self::getPlayerPearls( $player_id );
		
		$lords = Lord::getSlots();
		$affordableLords = array();
		
		foreach ($lords as $lord) {
			$canAffordLord = self::canAffordLord($player_id, $hand, $pearls, $lord);
			if ($canAffordLord) {
				$affordableLords[] = $lord;
			}
		}
		
		return array(
			'_private' => array(
				'active' => array(
					'affordableLords' => $affordableLords
				)
			)
		);
	}
	
	function argPurchase() {
		$passed_players = self::getObjectListFromDB( "SELECT player_id id FROM player WHERE player_has_purchased", true );
		return [
			'passed_players' => array_map(fn($pId) => intval($pId), $passed_players), 
			'first_player' => intval(self::getGameStateValue( "first_player_id")),
			'cost' => intval(self::getGameStateValue( 'purchase_cost' )),
		];
	}

	function argDeckLocations() {
		$locations = Location::getDeck();
		return [
			'_private' => [
				'active' => [
					'locations' => $locations,
				]
			],
		];
	}

	function argControlPostDraw() {
		$player_id = self::getActivePlayerId();

		// List the Locations which are available for drawing
		$location_ids = array();
		for ($i=1; $i<=4; $i++) {
			$value = intval(self::getGameStateValue( "location_drawn_$i"));
			if ($value >= 0) {
				$location_ids[] = $value;
			}
		}

		$default_lord_ids = array();

		$lords = Lord::getPlayerHand( $player_id );

		// If you have an ambassador, you must select it first
		foreach ($lords as $lord) {
			if ($lord["turned"] || isset($lord["location"])) continue;
			if ($lord["lord_id"] == 33 || $lord["lord_id"] == 34 || $lord["lord_id"] == 35) {
				$default_lord_ids[] = intval($lord["lord_id"]);
				break;
			}
		}

		if (count($default_lord_ids) == 0) {
			$player_keys = self::getPlayerKeys( $player_id );
			$lord_keys_needed = 3 - $player_keys;
			if ($lord_keys_needed > 0) {
				if ($lord_keys_needed > 0) {
					foreach ($lords as $lord) {
						if (!isset($lord["location"]) && $lord["keys"] > 0 && ! $lord["turned"]) {
							$lord_keys_needed -= $lord["keys"];
							$default_lord_ids[] = intval($lord["lord_id"]);
							if ($lord_keys_needed <= 0) {
								break;
							}
						}
					}
				}
			}
		}

		return [
			'location_ids' => $location_ids, 
			'default_lord_ids' => $default_lord_ids,
		];
	}

	function argChooseMonsterReward() {
		$rewards = array();
		$threat = self::getGameStateValue( 'threat_level' );

		$player_id = self::getActivePlayerId();
		if ($threat >= 1 && Lord::opponentHas( 6 , $player_id ) && ! Lord::playerProtected( $player_id )) {
			$threat--;
		}

		$num_monsters = Monster::getDeckSize( );

		if ($threat == 0) {
			$rewards[] = "P";
			if ($num_monsters > 0) {
				$rewards[] = "M";
			}
		} else if ($threat == 1) {
			$rewards[] = "PP";
			if ($num_monsters > 0) {
				$rewards[] = "PM";
				if ($num_monsters > 1) {
					$rewards[] = "MM";
				}
			}
		} else if ($threat == 2) {
			$rewards[] = "K";
		} else if ($threat == 3) {
			$rewards[] = "KP";
			if ($num_monsters > 0) {
				$rewards[] = "KM";
			}
		} else if ($threat == 4) {
			$rewards[] = "KPP";
			if ($num_monsters > 0) {
				$rewards[] = "KPM";
				if ($num_monsters > 1) {
					$rewards[] = "KMM";
				}
			}
		} else if ($threat == 5) {
			$rewards[] = "KK";
		}

		return [
			'rewards' => $rewards,
		];
	}

	function argRecruitPay() {
		$lord_id = intval(self::getGameStateValue( 'selected_lord' ));
		return [
			'lord_id' => $lord_id, 
			'cost' => self::getLordCost(Lord::get($lord_id), self::getCurrentPlayerId()),
		];
	}

	function argLordEffect() {
		$lord_id = self::getGameStateValue( 'selected_lord' );
		return [
			'lord' => Lord::get($lord_id),
		];
	}

	function argAffiliate() {
		$allies = array_values(Ally::getJustSpent());
		$min_allies = array();
		$player_id = self::getActivePlayerId();

		// You can only affiliate the minimum ally
		$lord_id = self::getGameStateValue( 'selected_lord' );
		if (! Lord::playerHas( 20 , $player_id ) || $lord_id == 20) {
			$min = 9999;
			foreach ($allies as $ally) {
				if ($ally['value'] < $min) {
					$min = $ally['value'];
				}
			}
			$factions_seen = array();
			foreach ($allies as $ally) {
				if ($ally['value'] == $min) {
					if (! isset($factions_seen[$ally['faction']])) {
						$factions_seen[$ally['faction']] = true;
						$min_allies[] = $ally;
					}
				}
			}

			return array('allies' => $min_allies);
		} else {
			$unique_allies = array();
			foreach ($allies as $ally) {
				$unique_allies["$ally[faction]-$ally[value]"] = $ally;
			}
			return array('allies' => $unique_allies);
		}
	}

	function argMartialLaw() {
		$playerId = self::getActivePlayerId();

		$allies = array_values(Ally::getPlayerHand($playerId));
		$diff = count($allies) - 12;
		$playerPearls = $this->getPlayerPearls($playerId);

		return [
			'canPay' => $diff <= $playerPearls,
			'diff' => $diff,
		];
	}
} 