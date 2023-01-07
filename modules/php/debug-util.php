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

		$this->debugPickAllies(2343492);
		$this->debugPickAllies(2343493);

		//$this->debugAddLocations(2343492);
		//$this->debugAddLord(2343492);

		$this->DbQuery("UPDATE player SET player_nebulis = 3");
		$this->DbQuery("UPDATE player SET player_pearls = 10");
		//$this->DbQuery("UPDATE player SET player_keys = 30");
		//$this->DbQuery("UPDATE location SET place = 1 WHERE location_id = 103");

		$this->gamestate->changeActivePlayer(2343492);
    }

	function debugPickAllies(int $playerId, int $number = 12) {
		for ($i=0; $i<$number; $i++) {
			$ally = Ally::draw();
			self::DbQuery( "UPDATE ally SET place = ".($playerId * -1)." WHERE ally_id = " . $ally["ally_id"] );
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
            83846198,
            86175279
		];

		// Id of the first player in BGA Studio
		$sid = 2343492;
		
		foreach ($ids as $id) {
			// basic tables
			$this->DbQuery("UPDATE player SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE global SET global_value=$sid WHERE global_value = $id" );
			$this->DbQuery("UPDATE card SET card_location_arg=$sid WHERE card_location_arg = $id" );

			// 'other' game specific tables. example:
			// tables specific to your schema that use player_ids
			$this->DbQuery("UPDATE card SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE discover_tile SET card_location_arg=$sid WHERE card_location_arg = $id" );
			$this->DbQuery("UPDATE objective_token SET card_location_arg=$sid WHERE card_location_arg = $id" );
			$this->DbQuery("UPDATE link SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE circle SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE operation SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE realized_objective SET player_id=$sid WHERE player_id = $id" );
			
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
