<?php
 /**
  *------
  * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
  * Abyss implementation : © sunil patel <sunil@xikka.com>
  *
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  *
  * abyss.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );
require_once('modules/abs_lord.php');
require_once('modules/abs_ally.php');
require_once('modules/abs_monster.php');
require_once('modules/abs_location.php');

class Abyss extends Table {

	public $state_ids = array(
		"plotAtCourt" => 2,
		"action" => 3,
		"secondStack" => 32,
		"explore" => 7,
		"explore2" => 71,
		"explore3" => 72,
		"control" => 9,
		"chooseMonsterReward" => 11,
		"recruitPay" => 12,
		"affiliate" => 13,
		"cleanupDiscard" => 15,
		"controlPostDraw" => 16,
		"unusedLords" => 18,
		"postpurchaseDiscard" => 61,
	);

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();

        self::initGameStateLabels([
                "threat_level" => 10,
				"purchase_cost" => 11,
				"first_player_id" => 12,
				"selected_lord" => 13,
				"extra_turn" => 14,

				"location_drawn_1" => 15,
				"location_drawn_2" => 16,
				"location_drawn_3" => 17,
				"location_drawn_4" => 18,

				"game_ending_player" => 19,

				"temp_value" => 20,
				"previous_state" => 21,
        ]);

				Lord::init( $this );
				Location::init( $this );
	}

    protected function getGameName() {
		// Used for translations and stuff. Please do not modify.
        return "abyss";
    }

    /*
        setupNewGame:

        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame($players, $options = []) {
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = 'INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar, player_pearls, `player_keys`) VALUES ';
        $values = array();
        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."',1,0)";
        }
        $sql .= implode(',', $values);
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();

        /************ Start the game initialization *****/

        // Init global values with their initial values
		self::setGameStateInitialValue( 'temp_value', 0 );
		self::setGameStateInitialValue( 'threat_level', 0 );
		self::setGameStateInitialValue( 'purchase_cost', 1 );
		self::setGameStateInitialValue( 'first_player_id', 0 );
		self::setGameStateInitialValue( 'selected_lord', 0 );
		self::setGameStateInitialValue( 'extra_turn', 0 );
		self::setGameStateInitialValue( 'game_ending_player', -1 );

        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
		self::initStat( 'table', "turns_number", 0 );
		self::initStat( 'player', "turns_number", 0 );
		self::initStat( 'player', "points_from_monsters", 0 );
		self::initStat( 'player', "points_from_lords", 0 );
		self::initStat( 'player', "points_from_allies", 0 );
		self::initStat( 'player', "points_from_locations", 0 );
		
		self::initStat( 'player', "times_plotted", 0 );
		self::initStat( 'player', "times_council", 0 );
		self::initStat( 'player', "pearls_spent_purchasing_allies", 0 );

        // Setup decks
		Lord::setup();
		Ally::setup();
		Location::setup();
		Monster::setup();

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas:

        Gather all informations about current game situation (visible by the current player).

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas() {
        $result = [];

        $current_player_id = self::getCurrentPlayerId();    // !! We must only return informations visible by this player !!

        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_name name, player_pearls pearls, player_keys `keys`, player_autopass autopass FROM player ";
        $result['players'] = self::getCollectionFromDb( $sql );
		foreach ($result['players'] as &$player) {
			$player['hand_size'] = Ally::getPlayerHandSize( $player['id'] );
			$player['num_monsters'] = Monster::getPlayerHandSize( $player['id'] );
			$player['affiliated'] = Ally::getPlayerAffiliated( $player['id'] );
			$player['lords'] = Lord::getPlayerHand( $player['id'] );
			$player['locations'] = Location::getPlayerHand( $player['id'] );

			if ($player['id'] == $current_player_id) {
				$player['hand'] = Ally::getPlayerHand( $player['id'] );
			}
			
			$state = $this->gamestate->state();
			if ($player['id'] == $current_player_id || $state["name"] == "gameEnd") {
				$player['monsters'] = Monster::getPlayerHand( $player['id'] );
			}
		}

        // Gather all information about current game situation (visible by player $current_player_id).
		$result['turn_order'] = self::getNextPlayerTable();

		$result['lord_slots'] = Lord::getSlots();
		$result['lord_deck'] = Lord::getDeckSize();
		$result['ally_explore_slots'] = Ally::getExploreSlots();
		$result['ally_council_slots'] = Ally::getCouncilSlots();
		$result['ally_deck'] = Ally::getDeckSize();
		$result['threat_level'] = self::getGameStateValue( 'threat_level' );
		$result['location_deck'] = Location::getDeckSize();
		$result['location_available'] = Location::getAvailable();
		$result['game_ending_player'] = self::getGameStateValue( 'game_ending_player' );

        return $result;
    }

    /*
        getGameProgression:

        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).

        This method is called each time we are in a game state with the "updateGameProgression" property set to true
        (see states.inc.php)
    */
    function getGameProgression() {
		$players = self::loadPlayersBasicInfos();
		$max_lords = 0;
		foreach ($players as $pid => $p) {
			$num_lords = count(Lord::getPlayerHand( $pid ));
			if ($num_lords > $max_lords) {
				$max_lords = $num_lords;
			}
		}
		return $max_lords * 14;
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    /*
        In this space, you can put any utility methods useful for your game logic
    */
		function returnToPrevious() {
			$previous = self::getGameStateValue( "previous_state" );
			$this->gamestate->nextState( "return_$previous" );
		}
		function getPlayerPearls( $player_id ) {
			return self::getUniqueValueFromDB( "SELECT player_pearls FROM player WHERE player_id = $player_id" );
		}

		function getPlayerKeys( $player_id ) {
			return self::getUniqueValueFromDB( "SELECT player_keys FROM player WHERE player_id = $player_id" );
		}

		function incPlayerPearls( $player_id, $diff, $source ) {
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

		function incPlayerKeys( $player_id, $diff, $source ) {
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

		public function getLordCost( $lord, $player_id ) {
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

		public function updatePlayerScore( $player_id, $final_scoring, $log = true, $update = true ) {
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

//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
////////////

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in abyss.action.php)
    */

	function explore( $fromRequest = true )
	{
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

		function exploreTake( $slot, $fromRequest = true )
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

		function recruit( $lord_id )
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
	
	function combinations($in_values, $number) {
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
	
	function hasCombination($values, $number, $required) {
		$combinations = self::combinations($values, $number);
		foreach ($combinations as $c) {
			if ($c >= $required) {
				return true;
			}
		}
		return false;
	}
	
	function canAffordLord($player_id, $hand, $pearls, $lord) {
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

		function affiliate( $ally_id ) {
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

		function chooseReward( $option ) {
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

		function pay( $ally_ids )
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

		function discard( $ally_ids ) {
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

		function chooseMonsterTokens( $target_player_id ) {
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

		function selectLord( $lord_id ) {
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

		function lordEffect( $lord_id ) {
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

		function drawLocations( $num ) {
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

		function chooseLocation( $location_id, $lord_ids ) {
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

		function selectAlly( $ally_id ) {
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
		
		function setAutopass( $autopass ) {
			$player_id = self::getCurrentPlayerId();
			
			$autopass_string = implode(";", $autopass);
			
			Abyss::DbQuery( "UPDATE player SET player_autopass = '$autopass_string' WHERE player_id = $player_id" );
			
			// $this->gamestate->nextState( 'loopback' );
		}


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
		return array(
			'passed_players' => $passed_players, 
			'first_player' => self::getGameStateValue( "first_player_id"),
			'cost' => self::getGameStateValue( 'purchase_cost' ));
	}

		function argDeckLocations() {
			$locations = Location::getDeck();
			return array(
          '_private' => array(
              'active' => array(
                  'locations' => $locations
              )
          )
      );
		}

		function argControlPostDraw() {
			$player_id = self::getActivePlayerId();

			// List the Locations which are available for drawing
			$location_ids = array();
			for ($i=1; $i<=4; $i++) {
				$value = self::getGameStateValue( "location_drawn_$i");
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
					$default_lord_ids[] = $lord["lord_id"];
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
								$default_lord_ids[] = $lord["lord_id"];
								if ($lord_keys_needed <= 0) {
									break;
								}
							}
						}
					}
				}
			}

			return array('location_ids' => $location_ids, 'default_lord_ids' => $default_lord_ids);
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

			return array('rewards' => $rewards);
		}

		function argRecruitPay() {
			$lord_id = self::getGameStateValue( 'selected_lord' );
			return array('lord_id' => $lord_id, 'cost' => self::getLordCost( Lord::get($lord_id), self::getCurrentPlayerId() ));
		}

		function argLordEffect() {
			$lord_id = self::getGameStateValue( 'selected_lord' );
			return array('lord' => Lord::get($lord_id));
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

    /*

    Example for game state "MyGameState":

    function argMyGameState()
    {
        // Get some values from the current game situation in database...

        // return values:
        return array(
            'variable1' => $value1,
            'variable2' => $value2,
            ...
        );
    }
    */

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    /*

    Example for game state "MyGameState":
*/
		function stPreTurn()
		{
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
		$breakdowns = array();
		
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
		$winner_id = self::getUniqueValueFromDB( "SELECT player_id FROM player ORDER BY player_score DESC, player_score_aux DESC LIMIT 1" );
		
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
	
	function stBlackSmokers()
	{
		if (Location::getDeckSize() == 0) {
			// If no locations in the deck, autopass!
			$this->gamestate->nextState( 'pass' );
		}
	}
	
	function stMustExplore()
	{
			$player_id = $this->getActivePlayerId();
			
			$this->explore(false);
	}
	
	function stMustExploreTake()
	{
			$player_id = $this->getActivePlayerId();
			
			$this->exploreTake(5, false);
	}

		function stAction()
    {
			self::checkAllyDeck();
    }

		function stUnusedLords()
		{
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

		function stPrePurchase()
		{
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

				$player_pearls = self::getPlayerPearls( $player_id );
				$player_obj = self::getObjectFromDB( "SELECT player_id id, player_autopass, player_has_purchased FROM player WHERE player_id = " . $player_id );
				$has_purchased = $player_obj["player_has_purchased"];
				$autopass = $player_obj["player_autopass"];
				if ($autopass) {
					$values = explode(";", $autopass);
					if (count($values) >= 5) {
						if ($values[$ally["faction"]] >= $ally["value"]) {
							# The player wishes to autopass this ally
							continue;
						}
					}
				}
				if ($player_pearls >= $purchase_cost && ! $has_purchased) {
					// They have enough money and haven't purchased yet!
					$this->gamestate->changeActivePlayer( $player_id );
					$this->gamestate->nextState( 'purchase' );
					return;
				}
			} while (true);
		}

		function stPreExplore()
		{
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

		function stPreControl()
		{
			$player_id = self::getActivePlayerId();

			// Shuffle Lords along to the right
			$lords = Lord::moveToRight();
			self::setGameStateValue( 'selected_lord', 0 );

			self::notifyAllPlayers( "moveLordsRight", '', array() );

			if (count($lords) <= 2) {
				// If the PP is showing, add PP, and draw new Lords (here)
				self::incPlayerPearls( $player_id, 2, "recruit" );
				$lords = Lord::refill();

				self::notifyAllPlayers( "refillLords", '', array(
						'lords' => $lords,
						'player_id' => $player_id,
						'deck_size' => Lord::getDeckSize()
				) );
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

		function stNextPlayer()
		{
			$player_id = self::getActivePlayerId();
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
							if (! isset($lowest_per_faction[$f]) || $lowest_per_faction[$f]["value"] > $ally["value"]) {
								$lowest_per_faction[$f] = $ally;
							}
						}
						// Affiliate these
						foreach ($lowest_per_faction as $ally) {
							Ally::affiliate( $pid, $ally["ally_id"] );
							self::notifyAllPlayers( "affiliate", clienttranslate('${player_name} affiliates ${card_name}'), array(
									'ally' => $ally,
									'player_id' => $pid,
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
							if (count(Location::getPlayerHand( $player_id )) > 0) {
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
						default;
							throw new BgaVisibleSystemException( "Not implemented." );
					}
			} else {
				if ($lord['lord_id'] == 5) {
					// Opponents must discard down to 6 cards
					$transition = "lord_5";
				} else if ($lord['lord_id'] == 11) {
					self::incPlayerPearls( $player_id, 1, "lord_11" );
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

		function stCleanupDiscard() {
			$player_id = self::getActivePlayerId();
			if (! Lord::opponentHas( 5 , $player_id ) || Lord::playerProtected( $player_id ) || Ally::getPlayerHandSize( $player_id ) <= 6) {
				// Skip this!
				$this->gamestate->nextState( "next" );
			}
		}


//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:

        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).

        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message.
    */

    function zombieTurn($state, $active_player) {
    	$statename = $state['name'];

        if ($state['type'] === "activeplayer") {
            switch ($statename) {
				case "explore"; case "explore2"; case "explore3";
					// This will only be relevant in a zombiePass situation (discard allies)
					// TODO : If this happens, players will need to refresh. Cba to do a notification just for this?
					self::DbQuery( "UPDATE ally SET place = 10 WHERE place >= 1 AND place <= 5");
                default:
                    $this->gamestate->nextState( "zombiePass" );
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, 'next' );

            return;
        }

        throw new feException( "Zombie mode not supported at this game state: ".$statename );
    }

///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:

        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.

    */

    function upgradeTableDb( $from_version ) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345

		if ($from_version <= 2101162111) {
			// Add 
			$sql = "ALTER TABLE `player` ADD `player_autopass` VARCHAR(25) NOT NULL DEFAULT '0,0,0,0,0';";
			self::applyDbUpgradeToAllDB( $sql );
		}
    }

	// Hacks
	public static function getCollection( $sql ) { return self::getCollectionFromDb( $sql ); }
	public static function getObject( $sql ) { return self::getObjectFromDB( $sql ); }
	public static function getValue( $sql ) { return self::getUniqueValueFromDB( $sql ); }
}
