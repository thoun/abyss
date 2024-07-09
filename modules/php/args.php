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
		$playerId = self::getActivePlayerId();
		$hand = Ally::getPlayerHand($playerId);
		$pearls = self::getPlayerPearls($playerId);
		
		$lords = Lord::getSlots();
		$affordableLords = [];
		
        $krakenExpansion = $this->isKrakenExpansion();
		$nebulis = $krakenExpansion ? min(Lord::playerHas(102, $playerId) ? 2 : 1, $this->getPlayerNebulis($playerId)) : 0;
		foreach ($lords as $lord) {
			$canAffordLord = self::canAffordLord($playerId, $hand, $pearls, $nebulis, $lord);
			if ($canAffordLord) {
				if ($this->isKrakenExpansion()) {
					$guarded = $this->guardedBySentinel('lord', $lord['lord_id']);
					if ($guarded !== null) {
						if ($guarded->playerId == $playerId) {
							$affordableLords[] = $lord;
						}
					} else {
						$affordableLords[] = $lord;
					}
				} else {
					$affordableLords[] = $lord;
				}
			}
		}
		
		return [
			'_private' => [
				'active' => [
					'affordableLords' => $affordableLords
				],
			],
			'canPlaceSentinel' => $this->mustPlaceSentinel($playerId) != null,
		];
	}

	function getWithNebulis(int $playerId, int $cost) {
		$withNebulis = null;

		if ($this->isKrakenExpansion()) {
			$withNebulis = [];

			$maxNebulis = Lord::playerHas(102, $playerId) ? 2 : 1;

			for ($i = 1; $i <= $maxNebulis; $i++) {
				$withNebulis[$i] = $this->canPayWithNebulis($playerId, $cost - $i, $i);
			}
		}

		return $withNebulis;
	}

	function argExplorePurchase() {
		$passed_players = $this->getObjectListFromDB( "SELECT player_id id FROM player WHERE player_has_purchased", true);

		return [
			'passed_players' => array_map(fn($pId) => intval($pId), $passed_players), 
			'first_player' => intval(self::getGameStateValue( "first_player_id")),
		];
	}
	
	function argPurchase() {
		$argExplorePurchase = $this->argExplorePurchase();
		$playerId = self::getActivePlayerId();

		$cost = intval(self::getGameStateValue('purchase_cost'));
		
		$pearls = self::getPlayerPearls($playerId);

		$withNebulis = $this->getWithNebulis($playerId, $cost);

		return $argExplorePurchase + [
			'cost' => $cost,
			'canPayWithPearls' => $pearls >= $cost,
			'withNebulis' => $withNebulis,
		];
	}

	function argExplore() {
		$argExplorePurchase = $this->argExplorePurchase();
		
        $slots = Ally::getExploreSlots();
        $ally = end($slots);
		$monster = $ally !== false && $ally['faction'] === NULL;
		$canIgnore = false;
		if ($monster) {
			$canIgnore = Lord::playerHas(209, $playerId);
		}

		return $argExplorePurchase + [
			'ally' => $ally,
			'monster' => $monster,
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
		$playerId = self::getActivePlayerId();
		
		$lord_id = intval(self::getGameStateValue( 'selected_lord' ));
		$lord = Lord::get($lord_id);

		$cost = self::getLordCost($lord, self::getCurrentPlayerId());
		
		$pearls = self::getPlayerPearls($playerId);
		$nebulis = $this->isKrakenExpansion() ? $this->getPlayerNebulis($playerId) : null;

		$withNebulis = $this->getWithNebulis($playerId, $cost);
		$canAlwaysUseNebulis = Lord::playerHas(103, $playerId);

		$argAffordableLords = $this->argAffordableLords();

		return [
			'_private' => $argAffordableLords['_private'],
			'lord_id' => $lord_id, 
			'lord' => $lord, 
			'cost' => $cost,
			'pearls' => $pearls,
			'nebulis' => $nebulis,
			'withNebulis' => $withNebulis,
			'canAlwaysUseNebulis' => $canAlwaysUseNebulis,
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

	function argGiveKraken() {
		return [
			'playersIds' => $this->getGlobalVariable(MUST_SELECT_NEW_PLAYER_FOR_KRAKEN),
		];
    }

	function argLord104() {
		$playerId = self::getActivePlayerId();

		return [
			'nebulis' => $this->getPlayerNebulis($playerId),
			'playersIds' => $this->getOpponentsIds($playerId),
		];
	}

	function argLord112() {
		return [
			'allies' => Ally::getDiscard(),
		];
	}

	function argLord114() {
		$faction = intval($this->getGameStateValue(SELECTED_FACTION));

		return [
			'faction' => $faction,
			'factionName' => $this->factions[$faction]["ally_name"], // for logs
            'i18n' => ['factionName']
		];
	}

	function argLord116() {
		$playerId = self::getActivePlayerId();
		
		$lords = Lord::getPlayerHand($playerId);
		$lords = array_values(array_filter($lords, fn($lord) => $lord["location"] != null));

		return [
			'lords' => $lords,
		];
	}

	function argPlaceSentinel() {
		$sentinels = $this->getSentinels();

		$possibleOnLords = !array_some($sentinels, fn($sentinel) => $sentinel->location == 'lord');
		$possibleOnCouncil = !array_some($sentinels, fn($sentinel) => $sentinel->location == 'council');
		$possibleOnLocations = !array_some($sentinels, fn($sentinel) => $sentinel->location == 'location');
		if ($possibleOnLocations && count(Location::getAvailable()) == 0) {			
			$possibleOnLocations = false; // if no location available on the table
		}

		return [
			'possibleOnLords' => $possibleOnLords,
			'possibleOnCouncil' => $possibleOnCouncil,
			'possibleOnLocations' => $possibleOnLocations,
		];
	}

	function argPlaceKraken() {
		$remainingKrakens = Ally::getExploreSlots();
		$ally = count($remainingKrakens) > 0 ? $remainingKrakens[0] : null;

		return [
			'ally' => $ally,
		];
	}

	function argChooseLeviathanToFight(): array {
		$playerId = $this->getActivePlayerId();

		$selectableLeviathans = LeviathanManager::canFightSome(Ally::getPlayerHand( $playerId ), $playerId);

		return [
			'selectableLeviathans' => $selectableLeviathans,
		];
	}

	function argChooseAllyToFight(): array {
		$playerId = $this->getActivePlayerId();

		$leviathan = LeviathanManager::getFightedLeviathan();
		$selectableAllies = LeviathanManager::canFightWith($leviathan, Ally::getPlayerHand( $playerId ), $playerId);
		
		return [
			'selectableAllies' => $selectableAllies,
		];
	}

	function argIncreaseAttackPower(): array {
		$playerId = $this->getActivePlayerId();

        $ally = Ally::get($this->getGlobalVariable(ALLY_FOR_FIGHT));
		$payPearlEffect = $ally['effect'] === 1;
		$playerPearls = $this->getPlayerPearls($playerId);
		$attackPower = $this->getGlobalVariable(ATTACK_POWER);

		return [
			'payPearlEffect' => $payPearlEffect,
			'playerPearls' => $playerPearls,
			'attackPower' => $attackPower,
		];
	}

	function argChooseFightReward(): array {
		$rewards = $this->getGlobalVariable(REMAINING_REWARDS);
		return [
			'rewards' => $rewards,
		];
	}

	function argChooseFightAgain(): array {
		$playerId = $this->getActivePlayerId();

		$slayedLeviathans = $this->getGlobalVariable(SLAYED_LEVIATHANS);
		$handCount = count(Ally::getPlayerHand($playerId));

		return [
			'slayedLeviathans' => $slayedLeviathans,
			'handCount' => $handCount,
		];
	}

	function argLord210() {
		$leviathan = LeviathanManager::getLeviathanAtSlot(99);

		$leviathans = LeviathanManager::getVisibleLeviathans();
		$allSlots = array_unique(LEVIATHAN_SLOTS);
		$occupiedSlots = array_map(fn($l) => $l->place, $leviathans);
		$freeSlots = array_values(array_diff($allSlots, $occupiedSlots));

		return [
			'leviathan' => $leviathan,
			'freeSlots' => $freeSlots,
		];
	}
} 
