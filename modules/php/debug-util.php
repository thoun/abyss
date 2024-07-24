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
		$this->debug_pickAllies(2343492);
		$this->debug_pickAllies(2343493);
		//$this->debug_fillLeviathans();
		//$this->debug_pickAllies(2343494);
		
		//$this->debugPickKrakens(2343492);
		//$this->debugPickKrakens(2343493);
		//$this->debugPickKrakens(2343494);

		//$this->debugAddLocations(2343492);
		//$this->debug_addRandomLord(2343492);
		//$this->debug_addRandomLord(2343493);
		//$this->debugAddAffiliated(2343492);

		//$this->DbQuery("UPDATE player SET player_nebulis = 2");
		$this->DbQuery("UPDATE player SET player_pearls = 10");
		$this->DbQuery("UPDATE player SET `player_autopass` = '5;5;5;5;5'");
		//$this->DbQuery("UPDATE player SET player_keys = 3");
		//$this->DbQuery("UPDATE location SET place = 1 WHERE location_id = 103");
		$this->DbQuery("UPDATE lord SET place = 0 WHERE place IN (2, 3, 4, 6)");
		$this->DbQuery("UPDATE lord SET place = 2 WHERE lord_id = 208");
		$this->DbQuery("UPDATE lord SET place = 3 WHERE lord_id = 210");
		$this->DbQuery("UPDATE lord SET place = 4 WHERE lord_id = 202");
		$this->DbQuery("UPDATE lord SET place = 6 WHERE lord_id = 206");
		//$this->DbQuery("UPDATE lord SET place = -2343492 WHERE lord_id = 111");
		//$this->setKrakenPlayer(2343492);
		//$this->setScourgePlayer(2343492);

		//$this->setGameStateValue('game_ending_player', 2343492);
		//$this->gamestate->changeActivePlayer(2343492);
    }

	function debug_pickAllies(int $playerId, int $number = 12) {
		for ($i=0; $i<$number; $i++) {
			$ally = Ally::draw();
			$this->DbQuery( "UPDATE ally SET place = ".($ally['faction'] === null ? 0 : ($playerId * -1))." WHERE ally_id = " . $ally["ally_id"] );
		}
	}

	function debugPickKrakens(int $playerId, int $number = 12) {
		for ($i=0; $i<$number; $i++) {
			$ally = Ally::draw();
			$this->DbQuery( "UPDATE ally SET place = ".($ally['faction'] != 10 ? 0 : ($playerId * -1))." WHERE ally_id = " . $ally["ally_id"] );
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
			$this->DbQuery( "UPDATE ally SET place = ".($ally['faction'] == null ? 0 : ($playerId * -1)).", affiliated = true WHERE ally_id = " . $ally["ally_id"] );
		}
	}

	function debugCouncilAllies(int $number = 12) {
		for ($i=0; $i<$number; $i++) {
			$ally = Ally::draw();
			$this->DbQuery( "UPDATE ally SET place = 6, faction = ".$ally["faction"]." WHERE ally_id = " . $ally["ally_id"] );
		}
	}

	function debug_addRandomLord(int $playerId, $location = null, int $number = 3) {
		for ($i=0; $i<$number; $i++) {
			$lord = $this->getObject( "SELECT * FROM lord WHERE place = 0 ORDER BY RAND() LIMIT 1" );
			$this->DbQuery($location == null ? 
				"UPDATE lord SET place = ".($playerId * -1)." WHERE lord_id = " . $lord["lord_id"] : 
				"UPDATE lord SET place = ".($playerId * -1).", location = $location WHERE lord_id = " . $lord["lord_id"] 
			);
		}
	}

	function debug_addLord(int $playerId, int $type) {
		$this->DbQuery("UPDATE lord SET place = ".($playerId * -1)." WHERE lord_id = $type");
	}

	function debugAddLocations(int $playerId, int $number = 3) {
		for ($i=0; $i<$number; $i++) {
			$location = Location::draw();
			$this->DbQuery( "UPDATE location SET place = ".($playerId * -1)." WHERE location_id = " . $location["location_id"] );
			$this->debug_addRandomLord($playerId, $location["location_id"], min($i, 3));
		}
	}

	function debug_SetAllyFaction(int $id, int $faction) {
		$this->DbQuery("UPDATE ally SET faction = $faction WHERE ally_id = $id");
	}

	// debugSetPlayerPearls(2343492, 10)
	function debug_SetPlayerPearls(int $playerId, int $number) {
		$this->DbQuery("UPDATE player SET player_pearls = $number WHERE player_id = $playerId");
	}
	function debug_SetPlayerNebulis(int $playerId, int $number) {
		$this->DbQuery("UPDATE player SET player_nebulis = $number WHERE player_id = $playerId");
	}
	function debug_SetPlayerKeys(int $playerId, int $number) {
		$this->DbQuery("UPDATE player SET player_keys = $number WHERE player_id = $playerId");
	}

	function debug_fillLeviathans() {
		foreach (array_unique(LEVIATHAN_SLOTS) as $slot) {
			LeviathanManager::draw($slot);
		}
	}

	function debug_fight() {
		$this->globals->set(SLAYED_LEVIATHANS, 0);
		$this->gamestate->jumpToState(ST_PLAYER_CHOOSE_LEVIATHAN_TO_FIGHT);
	}

	function debug_endGame() {
		$this->gamestate->jumpToState(ST_PRE_SCORING);
	}

    public function loadBugReportSQL(int $reportId, array $studioPlayers): void
    {
        $prodPlayers = $this->getObjectListFromDb("SELECT `player_id` FROM `player`", true);
        $prodCount = count($prodPlayers);
        $studioCount = count($studioPlayers);
        if ($prodCount != $studioCount) {
            throw new BgaVisibleSystemException("Incorrect player count (bug report has $prodCount players, studio table has $studioCount players)");
        }

        // SQL specific to your game
        // For example, reset the current state if it's already game over
        $this->DbQuery("UPDATE `global` SET `global_value` = 10 WHERE `global_id` = 1 AND `global_value` = 99");
		
        foreach ($prodPlayers as $index => $prodId) {
            $studioId = $studioPlayers[$index];
			// basic tables
			$this->DbQuery("UPDATE player SET player_id=$studioId WHERE player_id = $prodId" );
			$this->DbQuery("UPDATE global SET global_value=$studioId WHERE global_value = $prodId" );

			// 'other' game specific tables. example:
			// tables specific to your schema that use player_ids
			$this->DbQuery("UPDATE lord SET place=-$studioId WHERE place = -$prodId" );
			$this->DbQuery("UPDATE ally SET place=-$studioId WHERE place = -$prodId" );
			$this->DbQuery("UPDATE location SET place=-$studioId WHERE place = -$prodId" );
			$this->DbQuery("UPDATE monster SET place=-$studioId WHERE place = -$prodId" );
		}

        //$this->reloadPlayersBasicInfos();
	}

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }
}
