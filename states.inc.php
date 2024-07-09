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
 * states.inc.php
 *
 * Abyss game states description
 *
 */

/*
	Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
	in a very easy way from this configuration file.

	Please check the BGA Studio presentation about game state to understand this, and associated documentation.

	Summary:

	States types:
	_ activeplayer: in this type of state, we expect some action from the active player.
	_ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
	_ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
	_ manager: special type for initial and final state

	Arguments of game states:
	_ name: the name of the GameState, in order you can recognize it on your own code.
	_ description: the description of the current game state is always displayed in the action status bar on
						the top of the game. Most of the time this is useless for game state with "game" type.
	_ descriptionmyturn: the description of the current game state when it's your turn.
	_ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
	_ action: name of the method to call when this game state become the current game state. Usually, the
 				action method is prefixed by "st" (ex: "stMyGameStateName").
	_ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
 							method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
	_ transitions: the transitions are the possible paths to go from a game state to another. You must name
						transitions in order to use transition names in "nextState" PHP method, and use IDs to
						specify the next game state for each transition.
	_ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
  			client side to be used on "onEnteringState" or to set arguments in the gamestate description.
	_ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
 									method).
*/

// 	!! It is not a good idea to modify this file when a game is running !!


$machinestates = array(

 	// The initial state. Please do not modify.
 	ST_BGA_GAME_SETUP => array(
  		"name" => "gameSetup",
  		"description" => "",
  		"type" => "manager",
  		"action" => "stGameSetup",
  		"transitions" => array( "" => ST_PRE_TURN )
 	),

 	ST_PRE_TURN => array(
 			"name" => "preTurn",
 			"type" => "game",
  		"action" => "stPreTurn",
 			"transitions" => array( "" => ST_PLAYER_PLOT_AT_COURT )
 	),

 	ST_PLAYER_PLOT_AT_COURT => array(
 			"name" => "plotAtCourt",
 			"description" => clienttranslate('${actplayer} may spend a Pearl to bring a new Lord to Court'),
 			"descriptionmyturn" => clienttranslate('${you} may spend a Pearl to bring a new Lord to Court'),
 			"type" => "activeplayer",
			"args" => "argAffordableLords",
			"action" => "stPlotAtCourt",
 			"possibleactions" => array( "plot", "pass", "explore", "requestSupport", "recruit", "lordEffect", "goToPlaceSentinel" ),
 			"transitions" => array( "plot" => ST_PLAYER_PLOT_AT_COURT, "pass" => ST_PLAYER_ACTION, "explore" => ST_PRE_PURCHASE, "requestSupport" => ST_PRE_CONTROL, "requestSupport2" => ST_PLAYER_SECOND_STACK, "recruit" => ST_PLAYER_RECRUIT_PAY, "lord_17" => ST_PLAYER_LORD17, "lord_21" => ST_PLAYER_LORD21, "lord_12" => ST_PLAYER_LORD12, "zombiePass" => ST_PLAYER_ACTION, "loopback" => ST_PLAYER_PLOT_AT_COURT
			, "placeSentinel" => ST_PLAYER_PLACE_SENTINEL, )
 	),

 	ST_PLAYER_ACTION => array(
 			"name" => "action",
 			"description" => clienttranslate('${actplayer} must explore, request support or recruit a Lord'),
 			"descriptionmyturn" => clienttranslate('${you} must explore, request support or recruit a Lord'),
 			"type" => "activeplayer",
			"args" => "argAffordableLords",
			"action" => "stAction",
 			"possibleactions" => array( "explore", "requestSupport", "recruit", "lordEffect", "goToPlaceSentinel" ),
 			"transitions" => array( "explore" => ST_PRE_PURCHASE, "requestSupport" => ST_PRE_CONTROL, "requestSupport2" => ST_PLAYER_SECOND_STACK, "recruit" => ST_PLAYER_RECRUIT_PAY, "lord_17" => ST_PLAYER_LORD17, "lord_21" => ST_PLAYER_LORD21, "lord_12" => ST_PLAYER_LORD12, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_ACTION 
			 , "placeSentinel" => ST_PLAYER_PLACE_SENTINEL, )
 	),

 	ST_PLAYER_SECOND_STACK => array(
 			"name" => "secondStack",
 			"description" => clienttranslate('${actplayer} must take a second stack from the Council'),
 			"descriptionmyturn" => clienttranslate('${you} must take a second stack from the Council'),
 			"type" => "activeplayer",
 			"possibleactions" => array( "requestSupport", "lordEffect" ),
 			"transitions" => array( "requestSupport" => ST_PRE_CONTROL, "requestSupport2" => ST_PRE_CONTROL, "lord_17" => ST_PLAYER_LORD17, "lord_21" => ST_PLAYER_LORD21, "lord_12" => ST_PLAYER_LORD12, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_SECOND_STACK )
 	),

 	ST_PRE_PURCHASE => array(
		"name" => "prepurchase",
		"type" => "game",
  		"action" => "stPrePurchase",
 		"transitions" => array( "purchase" => ST_PLAYER_PURCHASE, "explore" => ST_PRE_EXPLORE )
 	),

 	ST_PLAYER_PURCHASE => array(
		"name" => "purchase",
		"description" => clienttranslate('${actplayer} may purchase the last Ally or pass'),
		"descriptionmyturn" => clienttranslate('${you} may purchase the last Ally or pass'),
		"type" => "activeplayer",
  		"args" => "argPurchase",
		"possibleactions" => array( "purchase", "pass" ),
		"transitions" => array( "purchase" => ST_PLAYER_POST_PURCHASE_DISCARD, "pass" => ST_PRE_PURCHASE, "zombiePass" => ST_PRE_PURCHASE, "loopback" => ST_PLAYER_PURCHASE )
 	),

 	ST_PRE_EXPLORE => array(
 			"name" => "preexplore",
 			"type" => "game",
  		"action" => "stPreExplore",
 			"transitions" => array( "default" => ST_PLAYER_EXPLORE, "trackFull" => ST_PLAYER_EXPLORE3 )
 	),

	 ST_PLAYER_POST_PURCHASE_DISCARD => array(
      "name" => "postpurchaseDiscard",
      "description" => clienttranslate('${actplayer} must discard down to 6 Allies'),
       "descriptionmyturn" => clienttranslate('${you} must discard down to 6 Allies'),
       "type" => "activeplayer",
      "action" => "stCleanupDiscard",
      "possibleactions" => array( "discard" ),
       "transitions" => array( "next" => ST_POST_PURCHASE, "zombiePass" => ST_POST_PURCHASE, "loopback" => ST_POST_PURCHASE )
  ),

  ST_POST_PURCHASE => array(
 			"name" => "postpurchase",
 			"type" => "game",
  		"action" => "stPreExplore",
 			"transitions" => array( "default" => ST_PLAYER_EXPLORE2 )
 	),

 	ST_PLAYER_EXPLORE => array(
 			"name" => "explore",
 			"description" => clienttranslate('${actplayer} must take the last card or explore'),
 			"descriptionmyturn" => clienttranslate('${you} must take the last card or explore'),
 			"type" => "activeplayer",
 			"args" => "argExplore",
 			"possibleactions" => array( "explore", "exploreTake", "lordEffect" ),
 			"transitions" => [
				"explore" => ST_PRE_PURCHASE, 
				"exploreTakeAlly" => ST_PRE_CONTROL,  
				"exploreTakeAllyRemainingKrakens" => ST_PLAYER_PLACE_KRAKEN,
				"exploreTakeMonster" => ST_PLAYER_CHOOSE_MONSTER_REWARD, 
				"chooseLeviathanToFight" => ST_PLAYER_CHOOSE_LEVIATHAN_TO_FIGHT,
				"lord_17" => ST_PLAYER_LORD17, 
				"lord_21" => ST_PLAYER_LORD21, 
				"lord_12" => ST_PLAYER_LORD12, 
				"zombiePass" => ST_PRE_CONTROL, 
				"loopback" => ST_PLAYER_EXPLORE, 
			],
 	),

 	ST_PLAYER_EXPLORE2 => array(
 			"name" => "explore2",
 			"description" => clienttranslate('${actplayer} must explore'),
 			"descriptionmyturn" => clienttranslate('${you} must explore'),
 			"type" => "activeplayer",
 			"args" => "argExplore",
 			"action" => "stMustExplore",
 			"possibleactions" => array( "explore", "lordEffect" ),
 			"transitions" => array( "explore" => ST_PRE_PURCHASE, "lord_17" => ST_PLAYER_LORD17, "lord_21" => ST_PLAYER_LORD21, "lord_12" => ST_PLAYER_LORD12, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_EXPLORE2 )
 	),

 	ST_PLAYER_EXPLORE3 => array(
		"name" => "explore3",
		"description" => clienttranslate('${actplayer} must take the last card'),
		"descriptionmyturn" => clienttranslate('${you} must take the last card'),
		"type" => "activeplayer",
		"args" => "argExplore",
		"action" => "stMustExploreTake",
		"possibleactions" => array( "exploreTake", "lordEffect" ),
		"transitions" => [
			"exploreTakeAlly" => ST_PRE_CONTROL, 
			"exploreTakeAllyRemainingKrakens" => ST_PLAYER_PLACE_KRAKEN,
			"exploreTakeMonster" => ST_PLAYER_CHOOSE_MONSTER_REWARD, 
			"chooseLeviathanToFight" => ST_PLAYER_CHOOSE_LEVIATHAN_TO_FIGHT,
			"lord_17" => ST_PLAYER_LORD17, 
			"lord_21" => ST_PLAYER_LORD21, 
			"lord_12" => ST_PLAYER_LORD12, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_EXPLORE3,
		],
 	),

	ST_PLAYER_PLACE_KRAKEN => [
		"name" => "placeKraken",
		"description" => clienttranslate('${actplayer} must choose a council stack for the remaining Kraken'),
		"descriptionmyturn" => clienttranslate('${you} must choose a council stack for the remaining Kraken'),
		"type" => "activeplayer",
		"args" => "argPlaceKraken",
		"possibleactions" => [
			"placeKraken",
		],
		"transitions" => [
			"nextKraken" => ST_PLAYER_PLACE_KRAKEN, 
			"next" => ST_PRE_CONTROL,
			"zombiePass" => ST_PRE_CONTROL, 
		],
	],

 	ST_PRE_CONTROL => array(
		"name" => "precontrol",
		"type" => "game",
  		"action" => "stPreControl",
 		"transitions" => array( "control" => ST_PLAYER_CONTROL, "next" => ST_PLAYER_UNUSED_LORDS )
 	),

 	ST_PLAYER_CONTROL => [
 		"name" => "control",
  		"description" => clienttranslate('${actplayer} must choose a Location to control'),
 		"descriptionmyturn" => clienttranslate('${you} must choose a face-up Location to control or draw some from the deck'),
 		"type" => "activeplayer",
  		"args" => "argControlPostDraw",
  		"possibleactions" => [
			"chooseLocation", 
			"drawLocations",
		],
 		"transitions" => [
			"chooseLocation" => ST_PRE_CONTROL, 
			"drawLocations" => ST_PLAYER_CONTROL_POST_DRAW, 
			"locationEffectBlackSmokers" => ST_PLAYER_LOCATION_EFFECT_BLACK_SMOKERS, 
			"fillSanctuary" => ST_PLAYER_FILL_SANCTUARY,
			"lord_17" => ST_PLAYER_LORD17, 
			"lord_21" => ST_PLAYER_LORD21, 
			"lord_12" => ST_PLAYER_LORD12, 
			"zombiePass" => ST_PLAYER_MARTIAL_LAW, 
			"loopback" => ST_PLAYER_CONTROL,
		],
	],

	ST_PLAYER_FILL_SANCTUARY => [
		"name" => "fillSanctuary",
		"description" => clienttranslate('${actplayer} must choose to continue or stop searching'),
		"descriptionmyturn" => clienttranslate('${you} must choose to continue or stop searching'),
		"type" => "activeplayer",
		"action" => "stFillSanctuary",
		"possibleactions" => [
		    "searchSanctuary", 
		    "stopSanctuarySearch",
	    ],
		"transitions" => [
			"stay" => ST_PLAYER_FILL_SANCTUARY,
		    "next" => ST_PRE_CONTROL,
	    ],
   ],

 	ST_PLAYER_MARTIAL_LAW => [
 		"name" => "martialLaw",
  		"description" => clienttranslate('${actplayer} must select allies to discard or pay ${diff} pearls'),
 		"descriptionmyturn" => clienttranslate('${you} must select allies to discard or pay ${diff} pearls'),
 		"type" => "activeplayer",
		"action" => "stMartialLaw",
  		"args" => "argMartialLaw",
  		"possibleactions" => [ 'payMartialLaw', 'discard' ],
 		"transitions" => [ 
			"stay" => ST_PLAYER_MARTIAL_LAW, 
			"next" => ST_NEXT_PLAYER, 
			"zombiePass" => ST_NEXT_PLAYER,
		],
	],

 	ST_NEXT_PLAYER => array(
 			"name" => "next",
 			"type" => "game",
  		"action" => "stNextPlayer",
  		"updateGameProgression" => true,
 			"transitions" => array( "endGame" => ST_PRE_SCORING, "plot" => ST_PRE_TURN )
 	),

 	ST_PLAYER_CHOOSE_MONSTER_REWARD => [
 			"name" => "chooseMonsterReward",
  		"description" => clienttranslate('${actplayer} must choose a reward'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a reward'),
 			"type" => "activeplayer",
  		"args" => "argChooseMonsterReward",
  		"action" => "stChooseMonsterReward",
  		"possibleactions" => [
			"chooseReward", 
			"lordEffect",
		],
 		"transitions" => [
			"next" => ST_PRE_CONTROL,
			"exploreTakeAllyRemainingKrakens" => ST_PLAYER_PLACE_KRAKEN,
			"lord_17" => ST_PLAYER_LORD17, 
			"lord_21" => ST_PLAYER_LORD21, 
			"lord_12" => ST_PLAYER_LORD12, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_CHOOSE_MONSTER_REWARD,
		],
 	],

 	ST_PLAYER_RECRUIT_PAY => [
 		"name" => "recruitPay",
  		"description" => clienttranslate('${actplayer} must pay for the chosen Lord'),
		"descriptionmyturn" => clienttranslate('${you} must pay for the chosen Lord'),
		"type" => "activeplayer",
  		"args" => "argRecruitPay",
  		"possibleactions" => [
			"recruit",
			"pay", 
			"pass", 
			"lordEffect",
		],
 		"transitions" => [
			"pay" => ST_PLAYER_AFFILIATE, 
			"pass" => ST_PLAYER_PLOT_AT_COURT, 
			"recruit" => ST_PLAYER_RECRUIT_PAY,
			"lord_17" => ST_PLAYER_LORD17, 
			"lord_21" => ST_PLAYER_LORD21, 
			"lord_12" => ST_PLAYER_LORD12, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_RECRUIT_PAY,
		],
	],

 	ST_PLAYER_AFFILIATE => [
 		"name" => "affiliate",
  		"description" => clienttranslate('${actplayer} must choose an Ally to affiliate'),
		"descriptionmyturn" => clienttranslate('${you} must choose an Ally to affiliate'),
		"type" => "activeplayer",
  		"args" => "argAffiliate",
  		"action" => "stAffiliate",
  		"possibleactions" => [
			"affiliate", 
			"cancelRecruit",
			"lordEffect",
		],
 		"transitions" => [
			"cancel" => ST_PLAYER_RECRUIT_PAY,
			"affiliate" => ST_PLAYER_LORD_EFFECT, 
			"lord_17" => ST_PLAYER_LORD17, 
			"lord_21" => ST_PLAYER_LORD21, 
			"lord_12" => ST_PLAYER_LORD12, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_AFFILIATE,
		],
 	],

 	ST_PLAYER_LORD_EFFECT => array(
 			"name" => "lordEffect",
  		"description" => clienttranslate('${actplayer} must apply effect of the new Lord'),
 			"descriptionmyturn" => clienttranslate('${you} must apply effect of the new Lord'),
 			"type" => "activeplayer",
  		"args" => "argLordEffect",
  		"action" => "stLordEffect",
  		"possibleactions" => [
			"pass",
		],
		"transitions" => [ 
			"done" => ST_PRE_CONTROL, 
			"lord_2" => ST_MULTI_LORD2, 
			"lord_4" => ST_PLAYER_LORD4, 
			"lord_5" => ST_MULTI_LORD5,
			"lord_7" => ST_PLAYER_LORD7, 
			"lord_16" => ST_PLAYER_LORD16, 
			"lord_19" => ST_PLAYER_LORD19, 
			"lord_22" => ST_PLAYER_LORD22,
			"lord_26" => ST_PLAYER_LORD26, 
			"lord_23" => ST_PLAYER_LORD23, 
			"lord_104" => ST_PLAYER_LORD104,
			"lord_112" => ST_PLAYER_LORD112,
			"lord_114" => ST_PLAYER_LORD114, 
			"lord_116" => ST_PLAYER_LORD116, 
			"lord_206" => ST_PLAYER_LORD206, 
			"lord_208" => ST_PLAYER_LORD208, 
			"lord_ambassador" => ST_PLAYER_CONTROL_POST_DRAW, 
			"lord_sentinel" => ST_PLAYER_PLACE_SENTINEL,
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_LORD_EFFECT,
		],
 	),

 	ST_PLAYER_CLEANUP_DISCARD => array(
 			"name" => "cleanupDiscard",
  		"description" => clienttranslate('${actplayer} must discard down to 6 Allies'),
 			"descriptionmyturn" => clienttranslate('${you} must discard down to 6 Allies'),
 			"type" => "activeplayer",
  		"action" => "stCleanupDiscard",
  		"possibleactions" => array( "discard", "lordEffect" ),
 			"transitions" => array( "next" => ST_PLAYER_MARTIAL_LAW, "lord_17" => ST_PLAYER_LORD17, "lord_21" => ST_PLAYER_LORD21, "lord_12" => ST_PLAYER_LORD12, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_CLEANUP_DISCARD )
 	),

 	ST_PLAYER_CONTROL_POST_DRAW => [
 		"name" => "controlPostDraw",
  		"description" => clienttranslate('${actplayer} must choose a Location to control'),
		"descriptionmyturn" => clienttranslate('${you} must choose a Location to control'),
		"type" => "activeplayer",
  		"args" => "argControlPostDraw",
		"possibleactions" => [ "chooseLocation"/*, "lordEffect"*/ ],
 		"transitions" => [
			"chooseLocation" => ST_PRE_CONTROL, 
			"locationEffectBlackSmokers" => ST_PLAYER_LOCATION_EFFECT_BLACK_SMOKERS, 			
			"fillSanctuary" => ST_PLAYER_FILL_SANCTUARY,
			"lord_17" => ST_PLAYER_LORD17, 
			"lord_21" => ST_PLAYER_LORD21, 
			"lord_12" => ST_PLAYER_LORD12,
			"zombiePass" => ST_PLAYER_MARTIAL_LAW,
			"loopback" => ST_PLAYER_CONTROL_POST_DRAW,
		],
	],

 	ST_PLAYER_LOCATION_EFFECT_BLACK_SMOKERS => [
		"name" => "locationEffectBlackSmokers",
		"description" => clienttranslate('${actplayer} may swap the Location for one from the deck'),
		"descriptionmyturn" => clienttranslate('${you} may swap the Location for one from the deck'),
		"type" => "activeplayer",
    	"action" => "stBlackSmokers",
		"args" => "argDeckLocations",
		"possibleactions" => [ "chooseLocation" ],
		"transitions" => [
			"chooseLocation" => ST_PRE_CONTROL, 					
			"fillSanctuary" => ST_PLAYER_FILL_SANCTUARY,
			"pass" => ST_PRE_CONTROL, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_LOCATION_EFFECT_BLACK_SMOKERS,
		],
	],

 	ST_PLAYER_UNUSED_LORDS => [
		"name" => "unusedLords",
		"description" => clienttranslate('${actplayer} may use the abilities of their unused Lords'),
		"descriptionmyturn" => clienttranslate('${you} may use the abilities of your unused Lords'),
		"type" => "activeplayer",
		"action" => "stUnusedLords",
		"possibleactions" => [
			"lordEffect", 
			"pass",
		],
		"transitions" => [
			"giveKraken" => ST_MULTIPLAYER_GIVE_KRAKEN,
			"pass" => ST_PLAYER_CLEANUP_DISCARD, 
			"lord_17" => ST_PLAYER_LORD17, 
			"lord_21" => ST_PLAYER_LORD21, 
			"lord_12" => ST_PLAYER_LORD12, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_UNUSED_LORDS
		],
	],

 	ST_MULTIPLAYER_GIVE_KRAKEN => [
 		"name" => "giveKraken",
  		"description" => clienttranslate('The player with the Kraken must give it to another player'),
		"descriptionmyturn" => clienttranslate('${you} must give the Kraken to another player'),
		"type" => "multipleactiveplayer",
  		"action" => "stGiveKraken",
		"args" => "argGiveKraken",
  		"possibleactions" => [
			"giveKraken"
		],
 		"transitions" => [
			"next" => ST_PLAYER_UNUSED_LORDS,
			"finalScore" => ST_FINAL_SCORING,
		],
	],

	ST_PLAYER_PLACE_SENTINEL => [
		"name" => "placeSentinel",
		"description" => clienttranslate('${actplayer} must place the sentinel'),
		"descriptionmyturn" => clienttranslate('${you} must place the sentinel'),
		"type" => "activeplayer",
		"args" => "argPlaceSentinel",
		"possibleactions" => [
			"placeSentinel",
		],
		"transitions" => [
			"nextSentinel" => ST_PLAYER_PLACE_SENTINEL,
		],
	],

	ST_PLAYER_CHOOSE_LEVIATHAN_TO_FIGHT => [
		"name" => "chooseLeviathanToFight",
		"description" => clienttranslate('${actplayer} must choose the Leviathan to fight'),
		"descriptionmyturn" => clienttranslate('${you} must choose the Leviathan to fight'),
		"type" => "activeplayer",
		"args" => "argChooseLeviathanToFight",
		"possibleactions" => [
			"actChooseLeviathanToFight",
		],
		"transitions" => [
			"next" => ST_PLAYER_CHOOSE_ALLY_TO_FIGHT,
		],
	],

	ST_PLAYER_CHOOSE_ALLY_TO_FIGHT => [
		"name" => "chooseAllyToFight",
		"description" => clienttranslate('${actplayer} must discard an Ally to fight the Leviathan'),
		"descriptionmyturn" => clienttranslate('${you} must discard an Ally to fight the Leviathan'),
		"type" => "activeplayer",
		"args" => "argChooseAllyToFight",
		"possibleactions" => [
			"actChooseAllyToFight",
		],
		"transitions" => [
			"next" => ST_PLAYER_INCREASE_ATTACK_POWER,
		],
	],

	ST_PLAYER_INCREASE_ATTACK_POWER => [
		"name" => "increaseAttackPower",
		"description" => clienttranslate('${actplayer} can increase attack power with Pearls (current attack power : ${attackPower})'),
		"descriptionmyturn" => clienttranslate('${you} can increase attack power with Pearls (current attack power : ${attackPower})'),
		"type" => "activeplayer",
		"args" => "argIncreaseAttackPower",
		"action" => "stIncreaseAttackPower",
		"possibleactions" => [
			"actIncreaseAttackPower",
		],
		"transitions" => [
			"nextSuccess" => ST_PLAYER_CHOOSE_FIGHT_REWARD,
			"nextFailed" => ST_PLAYER_CHOOSE_FIGHT_AGAIN,  
		],
	],

	ST_PLAYER_CHOOSE_FIGHT_REWARD => [
		"name" => "chooseFightReward",
		"description" => clienttranslate('${actplayer} must choose the rewards'),
		"descriptionmyturn" => clienttranslate('${you} must choose the rewards'),
		"type" => "activeplayer",
		"args" => "argChooseFightReward",
		"possibleactions" => [
			"actChooseFightReward",
		],
		"transitions" => [
			"next" => ST_PLAYER_CHOOSE_FIGHT_AGAIN,  
		],
	],

	ST_PLAYER_CHOOSE_FIGHT_AGAIN => [
		"name" => "chooseFightAgain",
		"description" => clienttranslate('${actplayer} must choose to fight again of end turn'),
		"descriptionmyturn" => clienttranslate('${you} must choose to fight again of end turn'),
		"type" => "activeplayer",
		"args" => "argChooseFightAgain",
		"action" => "stChooseFightAgain",
		"possibleactions" => [
			"actFightAgain",
			"actEndFight",
		],
		"transitions" => [
			"fightNewLeviathan" => ST_PLAYER_CHOOSE_LEVIATHAN_TO_FIGHT,
			"again" => ST_PLAYER_CHOOSE_ALLY_TO_FIGHT,
			"next" => ST_PRE_CONTROL,  
			"nextRemainingKrakens" => ST_PLAYER_PLACE_KRAKEN,
		],
	],

 	/* Lord effect (1xx) */
 	ST_MULTI_LORD2 => array(
 			"name" => "lord2",
  		"description" => clienttranslate('Other players must discard an Ally'),
 			"descriptionmyturn" => clienttranslate('${you} must discard an Ally'),
 			"type" => "multipleactiveplayer",
  		"action" => "stLord2",
  		"possibleactions" => array( "discard" ),
 			"transitions" => array( "next" => ST_PRE_CONTROL, "loopback" => ST_MULTI_LORD2 )
 	),
 	ST_PLAYER_LORD4 => array(
 			"name" => "lord4",
  		"description" => clienttranslate('${actplayer} must disable one Lord from each opponent'),
 			"descriptionmyturn" => clienttranslate('${you} must disable one Lord from each opponent'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "selectLord" ),
 			"transitions" => array( "selectLord" => ST_PLAYER_LORD4, "next" => ST_PRE_CONTROL, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD4 )
 	),
 	ST_MULTI_LORD5 => array(
 			"name" => "lord5",
  		"description" => clienttranslate('Other players must discard down to 6 Allies'),
 			"descriptionmyturn" => clienttranslate('${you} must discard down to 6 Allies'),
 			"type" => "multipleactiveplayer",
  		"action" => "stLord5",
  		"possibleactions" => array( "discard" ),
 			"transitions" => array( "next" => ST_PRE_CONTROL, "loopback" => ST_MULTI_LORD5 )
 	),
 	ST_PLAYER_LORD7 => array(
 			"name" => "lord7",
  		"description" => clienttranslate('${actplayer} must choose a player to steal a Monster token from'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a player to steal a Monster token from'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "chooseMonsterTokens" ),
 			"transitions" => array( "next" => ST_PRE_CONTROL, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD7 )
 	),
 	ST_PLAYER_LORD16 => array(
 			"name" => "lord16",
  		"description" => clienttranslate('${actplayer} must choose a Council stack to add to their hand'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a Council stack to add to your hand'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "requestSupport" ),
 			"transitions" => array( "requestSupport" => ST_PRE_CONTROL, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD16 )
 	),
 	ST_PLAYER_LORD19 => array(
 			"name" => "lord19",
  		"description" => clienttranslate('${actplayer} may swap a Location for an available one'),
 			"descriptionmyturn" => clienttranslate('${you} may choose a Location you control to swap with an available one'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "chooseLocation", "pass" ),
 			"transitions" => array( "chooseLocation" => ST_PLAYER_LORD19B, "pass" => ST_PRE_CONTROL, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD19 )
 	),
 	ST_PLAYER_LORD19B => [
 		"name" => "lord19b",
  		"description" => clienttranslate('${actplayer} may swap a Location for an available one'),
		"descriptionmyturn" => clienttranslate('${you} may choose an available Location to gain'),
		"type" => "activeplayer",
  		"possibleactions" => ["chooseLocation", "pass"],
		"transitions" => [
			"chooseLocation" => ST_PRE_CONTROL, 
			"locationEffectBlackSmokers" => ST_PLAYER_LOCATION_EFFECT_BLACK_SMOKERS,			
			"fillSanctuary" => ST_PLAYER_FILL_SANCTUARY,
			"pass" => ST_PRE_CONTROL, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_LORD19B,
		],
	],
 	ST_PLAYER_LORD22 => array(
 			"name" => "lord22",
  		"description" => clienttranslate('${actplayer} may recruit a second Lord for 5 Pearls'),
 			"descriptionmyturn" => clienttranslate('${you} may recruit a second Lord for 5 Pearls'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "recruit", "pass" ),
 			"transitions" => array( "recruit" => ST_PLAYER_LORD_EFFECT, "pass" => ST_PRE_CONTROL, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD22 )
 	),
 	ST_PLAYER_LORD23 => array(
 			"name" => "lord23",
  		"description" => clienttranslate('${actplayer} may discard a Lord to gain one from the Court'),
 			"descriptionmyturn" => clienttranslate('${you} may discard a Lord to gain one from the Court'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "selectLord", "pass" ),
 			"transitions" => array( "selectLord" => ST_PLAYER_LORD23B, "pass" => ST_PRE_CONTROL, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD23 )
 	),
 	ST_PLAYER_LORD23B => array(
 			"name" => "lord23b",
  		"description" => clienttranslate('${actplayer} may swap a Lord with one from the Court'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a Lord from the Court to gain'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "recruit" ),
 			"transitions" => array( "recruit" => ST_PLAYER_LORD_EFFECT, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD23B )
 	),
 	ST_PLAYER_LORD26 => array(
 			"name" => "lord26",
  		"description" => clienttranslate('${actplayer} may discard a Lord to gain one from the top of the deck'),
 			"descriptionmyturn" => clienttranslate('${you} may discard a Lord to gain one from the top of the deck'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "selectLord", "pass" ),
 			"transitions" => array( "selectLord" => ST_PLAYER_LORD_EFFECT, "pass" => ST_PRE_CONTROL, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD26 )
 	),

 	ST_PLAYER_LORD12 => array(
 			"name" => "lord12",
  		"description" => clienttranslate('${actplayer} may discard 1 Ally to gain 2 Pearls'),
 			"descriptionmyturn" => clienttranslate('${you} may discard 1 Ally to gain 2 Pearls'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "selectAlly", "pass" ),
 			"transitions" => array( "return_2" => ST_PLAYER_PLOT_AT_COURT, "return_3" => ST_PLAYER_ACTION, "return_32" => ST_PLAYER_SECOND_STACK,
  										"return_7" => ST_PLAYER_EXPLORE, "return_71" => ST_PLAYER_EXPLORE2, "return_72" => ST_PLAYER_EXPLORE3, "return_9" => ST_PLAYER_CONTROL, "return_11" => ST_PLAYER_CHOOSE_MONSTER_REWARD,
  										"return_12" => ST_PLAYER_RECRUIT_PAY, "return_13" => ST_PLAYER_AFFILIATE, "return_15" => ST_PLAYER_CLEANUP_DISCARD, "return_16" => ST_PLAYER_CONTROL_POST_DRAW, "return_18" => ST_PLAYER_UNUSED_LORDS, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD12 )
 	),
 	ST_PLAYER_LORD17 => array(
 			"name" => "lord17",
  		"description" => clienttranslate('${actplayer} may discard 1 stack from the Council'),
 			"descriptionmyturn" => clienttranslate('${you} may discard 1 stack from the Council'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "requestSupport", "pass" ),
 			"transitions" => array( "return_2" => ST_PLAYER_PLOT_AT_COURT, "return_3" => ST_PLAYER_ACTION, "return_32" => ST_PLAYER_SECOND_STACK,
  										"return_7" => ST_PLAYER_EXPLORE, "return_71" => ST_PLAYER_EXPLORE2, "return_72" => ST_PLAYER_EXPLORE3, "return_9" => ST_PLAYER_CONTROL, "return_11" => ST_PLAYER_CHOOSE_MONSTER_REWARD,
  										"return_12" => ST_PLAYER_RECRUIT_PAY, "return_13" => ST_PLAYER_AFFILIATE, "return_15" => ST_PLAYER_CLEANUP_DISCARD, "return_16" => ST_PLAYER_CONTROL_POST_DRAW, "return_18" => ST_PLAYER_UNUSED_LORDS, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD17 )
 	),
 	ST_PLAYER_LORD21 => array(
 			"name" => "lord21",
  		"description" => clienttranslate('${actplayer} may discard and replace a Lord from the Court'),
 			"descriptionmyturn" => clienttranslate('${you} may discard and replace a Lord from the Court'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "recruit", "pass" ),
 			"transitions" => array( "return_2" => ST_PLAYER_PLOT_AT_COURT, "return_3" => ST_PLAYER_ACTION, "return_32" => ST_PLAYER_SECOND_STACK,
  										"return_7" => ST_PLAYER_EXPLORE, "return_71" => ST_PLAYER_EXPLORE2, "return_72" => ST_PLAYER_EXPLORE3, "return_9" => ST_PLAYER_CONTROL, "return_11" => ST_PLAYER_CHOOSE_MONSTER_REWARD,
  										"return_12" => ST_PLAYER_RECRUIT_PAY, "return_13" => ST_PLAYER_AFFILIATE, "return_15" => ST_PLAYER_CLEANUP_DISCARD, "return_16" => ST_PLAYER_CONTROL_POST_DRAW, "return_18" => ST_PLAYER_UNUSED_LORDS, "zombiePass" => ST_PRE_CONTROL, "loopback" => ST_PLAYER_LORD21 )
 	),

 	ST_PLAYER_LORD104 => [
 		"name" => "lord104",
  		"description" => clienttranslate('${actplayer} must choose opponent(s) to give Nebulis to'),
		"descriptionmyturn" => clienttranslate('${you} must choose opponent(s) to give Nebulis to'),
		"type" => "activeplayer",
		"args" => "argLord104",
  		"possibleactions" => [
			"giveNebulisTo",
		],
 		"transitions" => [
			"next" => ST_PRE_CONTROL, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_LORD116,
		],
	],

 	ST_PLAYER_LORD112 => [
 		"name" => "lord112",
  		"description" => clienttranslate('${actplayer} must take an Ally from the discard'),
		"descriptionmyturn" => clienttranslate('${you} must take an Ally from the discard'),
		"type" => "activeplayer",
		"args" => "argLord112",
  		"possibleactions" => [
			"takeAllyFromDiscard",
		],
 		"transitions" => [
			"next" => ST_PRE_CONTROL, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_LORD116,
		],
	],

 	ST_PLAYER_LORD114 => [
 		"name" => "lord114",
  		"description" => clienttranslate('${actplayer} must choose a Race of Allies'),
		"descriptionmyturn" => clienttranslate('${you} must choose a Race of Allies'),
		"type" => "activeplayer",
  		"possibleactions" => [
			"selectAllyRace",
		],
 		"transitions" => [
			"next" => ST_MULTI_LORD114, 
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_LORD116,
		],
	],

	ST_MULTI_LORD114 => [
		"name" => "lord114multi",
		"description" => clienttranslate('Other players must discard an affiliated ${factionName} Ally'),
		"descriptionmyturn" => clienttranslate('${you} must discard an affiliated ${factionName} Ally'),
		"type" => "multipleactiveplayer",
		"action" => "stLord114",
		"args" => "argLord114",
		"possibleactions" => [
			"discard",
		],
		"transitions" => [
			"next" => ST_PRE_CONTROL,
		],
	],

 	ST_PLAYER_LORD116 => [
 		"name" => "lord116",
  		"description" => clienttranslate('${actplayer} must choose a Lord to free from its Location'),
		"descriptionmyturn" => clienttranslate('${you} must choose a Lord to free from its Location'),
		"type" => "activeplayer",
		"args" => "argLord116",
  		"possibleactions" => [
			"freeLord",
		],
 		"transitions" => [
			"freeLord" => ST_PRE_CONTROL, 
			"selectNewLocation" => ST_PLAYER_LORD_EFFECT,
			"zombiePass" => ST_PRE_CONTROL, 
			"loopback" => ST_PLAYER_LORD116,
		],
	],

	ST_PLAYER_LORD206 => [
		"name" => "lord206",
		"description" => clienttranslate('${actplayer} can fight a Leviathan'),
	    "descriptionmyturn" => clienttranslate('${you} can fight a Leviathan'),
	    "type" => "activeplayer",
	    "possibleactions" => [
		    "actFightImmediately",
		    "actIgnoreImmediatelyFightLeviathan",
		],
		"transitions" => [
		    "fight" => ST_PLAYER_CHOOSE_LEVIATHAN_TO_FIGHT,
		    "ignore" => ST_PRE_CONTROL,
		    "zombiePass" => ST_PRE_CONTROL, 
		    "loopback" => ST_PLAYER_LORD206,
	    ],
    ],

	ST_PLAYER_LORD208 => [
		"name" => "lord208",
		"description" => clienttranslate('${actplayer} must chose a Leviathan to remove a Health point to'),
	    "descriptionmyturn" => clienttranslate('${you} must chose a Leviathan to remove a Health point to'),
	    "type" => "activeplayer",
	    "possibleactions" => [
		    "actRemoveHealthPointToLeviathan",
		],
		"transitions" => [
		    "next" => ST_PLAYER_CHOOSE_FIGHT_REWARD,
		    "ignore" => ST_PRE_CONTROL,
		    "zombiePass" => ST_PRE_CONTROL, 
		    "loopback" => ST_PLAYER_LORD208,
	    ],
    ],

    ST_PLAYER_LORD210 => [
	    "name" => "lord210",
		"description" => clienttranslate('${actplayer} must choose a free space to place the new Leviathan'),
	    "descriptionmyturn" => clienttranslate('${you} must choose a free space to place the new Leviathan'),
	    "type" => "activeplayer",
	    "args" => "argLord210",
		"possibleactions" => [
		    "actChooseFreeSpace",
	    ],
	    "transitions" => [
		    "zombiePass" => ST_PRE_CONTROL, 
		    "loopback" => ST_PLAYER_LORD210,
	    ],
    ],

	ST_PRE_SCORING => [
		"name" => "preScoring",
		"description" => '',
		"descriptionmyturn" =>'',
		"type" => "game",
		"action" => "stPreScoring",
		"transitions" => [
			"giveKraken" => ST_MULTIPLAYER_GIVE_KRAKEN,
			"finalScore" => ST_FINAL_SCORING,
	    ],
   ],

	 ST_FINAL_SCORING => [
 		"name" => "finalScoring",
 		"description" => clienttranslate("Final scoring"),
  		"descriptionmyturn" => clienttranslate("Final scoring"),
 		"type" => "game",
 		"action" => "stFinalScoring",
 		"transitions" => [
			"" => ST_END_GAME,
		],
	],

 	// Final state.
 	// Please do not modify (and do not overload action/args methods).
 	ST_END_GAME => [
  		"name" => "gameEnd",
  		"description" => clienttranslate("End of game"),
  		"type" => "manager",
  		"action" => "stGameEnd",
  		"args" => "argGameEnd",
	],

);
