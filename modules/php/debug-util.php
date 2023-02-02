<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }

		//$this->debugCouncilAllies();

		//$this->debugPickMonsters(2343492, 10);
		//$this->debugPickMonsters(2343493, 2);
		$this->debugPickAllies(2343492);
		$this->debugPickAllies(2343493);
		//$this->debugPickAllies(2343494);
		
		//$this->debugPickKrakens(2343492);
		//$this->debugPickKrakens(2343493);
		//$this->debugPickKrakens(2343494);

		//$this->debugAddLocations(2343492);
		//$this->debugAddLord(2343492);
		//$this->debugAddLord(2343493);
		//$this->debugAddAffiliated(2343492);

		//$this->DbQuery("UPDATE player SET player_nebulis = 2");
		//$this->DbQuery("UPDATE player SET player_pearls = 2");
		$this->DbQuery("UPDATE player SET `player_autopass` = '5;5;5;5;5'");
		//$this->DbQuery("UPDATE player SET player_keys = 3");
		//$this->DbQuery("UPDATE location SET place = 1 WHERE location_id = 103");
		$this->DbQuery("UPDATE lord SET place = 0 WHERE place IN (5, 6)");
		$this->DbQuery("UPDATE lord SET place = 5 WHERE lord_id = 107");
		$this->DbQuery("UPDATE lord SET place = 6 WHERE lord_id = 108");
		//$this->DbQuery("UPDATE lord SET place = -2343492 WHERE lord_id = 111");
		//$this->setKrakenPlayer(2343492);
		//$this->setScourgePlayer(2343492);

		//$this->setGameStateValue('game_ending_player', 2343492);
		//$this->gamestate->changeActivePlayer(2343492);
    }

	function debugPickAllies(int $playerId, int $number = 12) {
		for ($i=0; $i<$number; $i++) {
			$ally = Ally::draw();
			self::DbQuery( "UPDATE ally SET place = ".($ally['faction'] === null ? 0 : ($playerId * -1))." WHERE ally_id = " . $ally["ally_id"] );
		}
	}

	function debugPickKrakens(int $playerId, int $number = 12) {
		for ($i=0; $i<$number; $i++) {
			$ally = Ally::draw();
			self::DbQuery( "UPDATE ally SET place = ".($ally['faction'] != 10 ? 0 : ($playerId * -1))." WHERE ally_id = " . $ally["ally_id"] );
		}
	}

	function debugPickMonsters(int $playerId, int $number = 10) {
		$leviathanExpansion = $this->isLeviathanExpansion();

		for ($i=0; $i<$number; $i++) {
			Monster::draw($playerId, $leviathanExpansion ? bga_rand(0, 1) : 0);
		}
	}

	function debugAddAffiliated(int $playerId, int $number = 5) {
		for ($i=0; $i<$number; $i++) {
			$ally = Ally::draw();
			self::DbQuery( "UPDATE ally SET place = ".($ally['faction'] == null ? 0 : ($playerId * -1)).", affiliated = true WHERE ally_id = " . $ally["ally_id"] );
		}
	}

	function debugCouncilAllies(int $number = 12) {
		for ($i=0; $i<$number; $i++) {
			$ally = Ally::draw();
			self::DbQuery( "UPDATE ally SET place = 6, faction = ".$ally["faction"]." WHERE ally_id = " . $ally["ally_id"] );
		}
	}

	function debugAddLord(int $playerId, $location = null, int $number = 3) {
		for ($i=0; $i<$number; $i++) {
			$lord = Abyss::getObject( "SELECT * FROM lord WHERE place = 0 ORDER BY RAND() LIMIT 1" );
			self::DbQuery($location == null ? 
				"UPDATE lord SET place = ".($playerId * -1)." WHERE lord_id = " . $lord["lord_id"] : 
				"UPDATE lord SET place = ".($playerId * -1).", location = $location WHERE lord_id = " . $lord["lord_id"] 
			);
		}
	}

	function debugAddLocations(int $playerId, int $number = 3) {
		for ($i=0; $i<$number; $i++) {
			$location = Location::draw();
			self::DbQuery( "UPDATE location SET place = ".($playerId * -1)." WHERE location_id = " . $location["location_id"] );
			$this->debugAddLord($playerId, $location["location_id"], min($i, 3));
		}
	}

	function debugSetPlayerPearls(int $playerId, int $number) {
		$this->DbQuery("UPDATE player SET player_pearls = $number WHERE player_id = $playerId");
	}
	function debugSetPlayerNebulis(int $playerId, int $number) {
		$this->DbQuery("UPDATE player SET player_nebulis = $number WHERE player_id = $playerId");
	}

    public function debugReplacePlayersIds() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

		// These are the id's from the BGAtable I need to debug.
		$ids = [
			86175279,
			92551685
		];

		// Id of the first player in BGA Studio
		$sid = 2343492;
		
		foreach ($ids as $id) {
			// basic tables
			$this->DbQuery("UPDATE player SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE global SET global_value=$sid WHERE global_value = $id" );

			// 'other' game specific tables. example:
			// tables specific to your schema that use player_ids
			$this->DbQuery("UPDATE lord SET place=-$sid WHERE place = -$id" );
			$this->DbQuery("UPDATE ally SET place=-$sid WHERE place = -$id" );
			$this->DbQuery("UPDATE location SET place=-$sid WHERE place = -$id" );
			$this->DbQuery("UPDATE monster SET place=-$sid WHERE place = -$id" );

			++$sid;
		}

        self::reloadPlayersBasicInfos();
	}

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }
}
