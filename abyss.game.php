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

require_once('modules/php/constants.inc.php');
require_once('modules/php/utils.php');
require_once('modules/php/actions.php');
require_once('modules/php/states.php');
require_once('modules/php/args.php');
require_once('modules/php/debug-util.php');

class Abyss extends Table {
    use UtilTrait;
    use ActionTrait;
    use StateTrait;
    use ArgsTrait;
    use DebugUtilTrait;

	public $state_ids = array(
		"plotAtCourt" => ST_PLAYER_PLOT_AT_COURT,
		"action" => ST_PLAYER_ACTION,
		"secondStack" => ST_PLAYER_SECOND_STACK,
		"explore" => ST_PLAYER_EXPLORE,
		"explore2" => ST_PLAYER_EXPLORE2,
		"explore3" => ST_PLAYER_EXPLORE3,
		"control" => ST_PLAYER_CONTROL,
		"chooseMonsterReward" => ST_PLAYER_CHOOSE_MONSTER_REWARD,
		"recruitPay" => ST_PLAYER_RECRUIT_PAY,
		"affiliate" => ST_PLAYER_AFFILIATE,
		"cleanupDiscard" => ST_PLAYER_CLEANUP_DISCARD,
		"controlPostDraw" => ST_PLAYER_CONTROL_POST_DRAW,
		"unusedLords" => ST_PLAYER_UNUSED_LORDS,
		"postpurchaseDiscard" => ST_POST_PURCHASE,
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

                MARTIAL_LAW_ACTIVATED => 22,
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
		$this->setGameStateInitialValue(MARTIAL_LAW_ACTIVATED, 1);

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
		Lord::setup(false);
		Ally::setup(false);
		Location::setup(false);
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

		if ($from_version <= 2212201335) {
			$sql = "CREATE TABLE IF NOT EXISTS `DBPREFIX_loot` (
                `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
                `value` tinyint(1) unsigned NOT NULL,
                `location_id` int(11),
                PRIMARY KEY (`id`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;";
			self::applyDbUpgradeToAllDB( $sql );
            
			$sql = "CREATE TABLE IF NOT EXISTS `global_variables` (
                `name` varchar(50) NOT NULL,
                `value` json,
                PRIMARY KEY (`name`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
			self::applyDbUpgradeToAllDB( $sql );
            
			$sql = "ALTER TABLE `DBPREFIX_player` ADD `player_nebulis` INT unsigned NOT NULL DEFAULT 0";
			self::applyDbUpgradeToAllDB( $sql );
		}
    }

	// Hacks
	public static function getCollection( $sql ) { return self::getCollectionFromDb( $sql ); }
	public static function getObject( $sql ) { return self::getObjectFromDB( $sql ); }
	public static function getValue( $sql ) { return self::getUniqueValueFromDB( $sql ); }
}
