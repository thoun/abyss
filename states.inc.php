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
 	1 => array(
  		"name" => "gameSetup",
  		"description" => "",
  		"type" => "manager",
  		"action" => "stGameSetup",
  		"transitions" => array( "" => 19 )
 	),

 	// Note: ID=2 => your first state

 	19 => array(
 			"name" => "preTurn",
 			"type" => "game",
  		"action" => "stPreTurn",
 			"transitions" => array( "" => 2 )
 	),

 	2 => array(
 			"name" => "plotAtCourt", // Also in $state_ids
 			"description" => clienttranslate('${actplayer} may spend a Pearl to bring a new Lord to Court'),
 			"descriptionmyturn" => clienttranslate('${you} may spend a Pearl to bring a new Lord to Court'),
 			"type" => "activeplayer",
			"args" => "argAffordableLords",
			"action" => "stPlotAtCourt",
 			"possibleactions" => array( "plot", "pass", "explore", "requestSupport", "recruit", "lordEffect" ),
 			"transitions" => array( "plot" => 2, "pass" => 3, "explore" => 4, "requestSupport" => 8, "requestSupport2" => 32, "recruit" => 12, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 3, "loopback" => 2 )
 	),

 	3 => array(
 			"name" => "action", // Also in $state_ids
 			"description" => clienttranslate('${actplayer} must explore, request support or recruit a Lord'),
 			"descriptionmyturn" => clienttranslate('${you} must explore, request support or recruit a Lord'),
 			"type" => "activeplayer",
			"args" => "argAffordableLords",
			"action" => "stAction",
 			"possibleactions" => array( "explore", "requestSupport", "recruit", "lordEffect" ),
 			"transitions" => array( "explore" => 4, "requestSupport" => 8, "requestSupport2" => 32, "recruit" => 12, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 3 )
 	),

 	32 => array(
 			"name" => "secondStack", // Also in $state_ids
 			"description" => clienttranslate('${actplayer} must take a second stack from the Council'),
 			"descriptionmyturn" => clienttranslate('${you} must take a second stack from the Council'),
 			"type" => "activeplayer",
 			"possibleactions" => array( "requestSupport", "lordEffect" ),
 			"transitions" => array( "requestSupport" => 8, "requestSupport2" => 8, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 32 )
 	),

 	4 => array(
 			"name" => "prepurchase",
 			"type" => "game",
  		"action" => "stPrePurchase",
 			"transitions" => array( "purchase" => 5, "explore" => 6 )
 	),

 	5 => array(
 			"name" => "purchase",
 			"description" => clienttranslate('${actplayer} may purchase the last Ally or pass'),
 			"descriptionmyturn" => clienttranslate('${you} may purchase the last Ally or pass'),
 			"type" => "activeplayer",
  		"args" => "argPurchase",
 			"possibleactions" => array( "purchase", "pass" ),
 			"transitions" => array( "purchase" => 62, "pass" => 4, "zombiePass" => 4, "loopback" => 5 )
 	),

 	6 => array(
 			"name" => "preexplore",
 			"type" => "game",
  		"action" => "stPreExplore",
 			"transitions" => array( "default" => 7, "trackFull" => 72 )
 	),

   62 => array(
      "name" => "postpurchaseDiscard", // Also in $state_ids
      "description" => clienttranslate('${actplayer} must discard down to 6 Allies'),
       "descriptionmyturn" => clienttranslate('${you} must discard down to 6 Allies'),
       "type" => "activeplayer",
      "action" => "stCleanupDiscard",
      "possibleactions" => array( "discard" ),
       "transitions" => array( "next" => 61, "zombiePass" => 61, "loopback" => 61 )
  ),

 	61 => array(
 			"name" => "postpurchase",
 			"type" => "game",
  		"action" => "stPreExplore",
 			"transitions" => array( "default" => 71 )
 	),

 	7 => array(
 			"name" => "explore", // Also in $state_ids
 			"description" => clienttranslate('${actplayer} must take the last card or explore'),
 			"descriptionmyturn" => clienttranslate('${you} must take the last card or explore'),
 			"type" => "activeplayer",
 			"args" => "argPurchase",
 			"possibleactions" => array( "explore", "exploreTake", "lordEffect" ),
 			"transitions" => array( "explore" => 4, "exploreTakeAlly" => 8, "exploreTakeMonster" => 11, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 7 )
 	),

 	71 => array(
 			"name" => "explore2", // Also in $state_ids
 			"description" => clienttranslate('${actplayer} must explore'),
 			"descriptionmyturn" => clienttranslate('${you} must explore'),
 			"type" => "activeplayer",
 			"args" => "argPurchase",
 			"action" => "stMustExplore",
 			"possibleactions" => array( "explore", "lordEffect" ),
 			"transitions" => array( "explore" => 4, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 71 )
 	),

 	72 => array(
 			"name" => "explore3", // Also in $state_ids
 			"description" => clienttranslate('${actplayer} must take the last card'),
 			"descriptionmyturn" => clienttranslate('${you} must take the last card'),
 			"type" => "activeplayer",
 			"args" => "argPurchase",
 			"action" => "stMustExploreTake",
 			"possibleactions" => array( "exploreTake", "lordEffect" ),
 			"transitions" => array( "exploreTakeAlly" => 8, "exploreTakeMonster" => 11, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 72 )
 	),

 	8 => array(
 			"name" => "precontrol",
 			"type" => "game",
  		"action" => "stPreControl",
 			"transitions" => array( "control" => 9, "next" => 18 )
 	),

 	9 => array(
 			"name" => "control", // Also in $state_ids
  		"description" => clienttranslate('${actplayer} must choose a Location to control'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a face-up Location to control or draw some from the deck'),
 			"type" => "activeplayer",
  		"args" => "argControlPostDraw",
  		"possibleactions" => array( "chooseLocation", "drawLocations"/*, "lordEffect"*/ ),
 			"transitions" => array( "chooseLocation" => 8, "drawLocations" => 16, "locationEffectBlackSmokers" => 17, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 10, "loopback" => 9 )
 	),

 	10 => array(
 			"name" => "next",
 			"type" => "game",
  		"action" => "stNextPlayer",
  		"updateGameProgression" => true,
 			"transitions" => array( "endGame" => 98, "plot" => 19 )
 	),

 	11 => array(
 			"name" => "chooseMonsterReward", // Also in $state_ids
  		"description" => clienttranslate('${actplayer} must choose a reward'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a reward'),
 			"type" => "activeplayer",
  		"args" => "argChooseMonsterReward",
  		"action" => "stChooseMonsterReward",
  		"possibleactions" => array( "chooseReward", "lordEffect" ),
 			"transitions" => array( "next" => 8, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 11 )
 	),

 	12 => array(
 			"name" => "recruitPay", // Also in $state_ids
  		"description" => clienttranslate('${actplayer} must pay for the chosen Lord'),
 			"descriptionmyturn" => clienttranslate('${you} must pay for the chosen Lord'),
 			"type" => "activeplayer",
  		"args" => "argRecruitPay",
  		"possibleactions" => array( "pay", "pass", "lordEffect" ),
 			"transitions" => array( "pay" => 13, "pass" => 2, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 12 )
 	),

 	13 => array(
 			"name" => "affiliate", // Also in $state_ids
  		"description" => clienttranslate('${actplayer} must choose an Ally to affiliate'),
 			"descriptionmyturn" => clienttranslate('${you} must choose an Ally to affiliate'),
 			"type" => "activeplayer",
  		"args" => "argAffiliate",
  		"possibleactions" => array( "affiliate", "lordEffect" ),
 			"transitions" => array( "affiliate" => 14, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 13 )
 	),

 	14 => array(
 			"name" => "lordEffect",
  		"description" => clienttranslate('${actplayer} must apply effect of the new Lord'),
 			"descriptionmyturn" => clienttranslate('${you} must apply effect of the new Lord'),
 			"type" => "activeplayer",
  		"args" => "argLordEffect",
  		"action" => "stLordEffect",
  		"possibleactions" => array( "pass" ),
 			"transitions" => array( "done" => 8, "lord_2" => 102, "lord_4" => 104, "lord_5" => 105,
  										"lord_7" => 107, "lord_16" => 116, "lord_19" => 119, "lord_22" => 122,
  										"lord_26" => 126, "lord_23" => 123, "lord_ambassador" => 16, "zombiePass" => 8, "loopback" => 14 )
 	),

 	15 => array(
 			"name" => "cleanupDiscard", // Also in $state_ids
  		"description" => clienttranslate('${actplayer} must discard down to 6 Allies'),
 			"descriptionmyturn" => clienttranslate('${you} must discard down to 6 Allies'),
 			"type" => "activeplayer",
  		"action" => "stCleanupDiscard",
  		"possibleactions" => array( "discard", "lordEffect" ),
 			"transitions" => array( "next" => 10, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 15 )
 	),

 	16 => array(
 			"name" => "controlPostDraw", // Also in $state_ids
  		"description" => clienttranslate('${actplayer} must choose a Location to control'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a Location to control'),
 			"type" => "activeplayer",
  		"args" => "argControlPostDraw",
		"possibleactions" => array( "chooseLocation"/*, "lordEffect"*/ ),
 			"transitions" => array( "chooseLocation" => 8, "locationEffectBlackSmokers" => 17, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 10, "loopback" => 16 )
 	),

 	17 => array(
		"name" => "locationEffectBlackSmokers",
		"description" => clienttranslate('${actplayer} may swap the Location for one from the deck'),
		"descriptionmyturn" => clienttranslate('${you} may swap the Location for one from the deck'),
		"type" => "activeplayer",
    "action" => "stBlackSmokers",
		"args" => "argDeckLocations",
		"possibleactions" => array( "chooseLocation" ),
		"transitions" => array( "chooseLocation" => 8, "pass" => 8, "zombiePass" => 8, "loopback" => 17 )
 	),

 	18 => array(
		"name" => "unusedLords",
		"description" => clienttranslate('${actplayer} may use the abilities of their unused Lords'),
		"descriptionmyturn" => clienttranslate('${you} may use the abilities of your unused Lords'),
		"type" => "activeplayer",
		"action" => "stUnusedLords",
		"possibleactions" => array( "lordEffect", "pass" ),
		"transitions" => array( "pass" => 15, "lord_17" => 117, "lord_21" => 121, "lord_12" => 112, "zombiePass" => 8, "loopback" => 18 )
 	),

 	/* Lord effect (1xx) */
 	102 => array(
 			"name" => "lord2",
  		"description" => clienttranslate('Other players must discard an Ally'),
 			"descriptionmyturn" => clienttranslate('${you} must discard an Ally'),
 			"type" => "multipleactiveplayer",
  		"action" => "stLord2",
  		"possibleactions" => array( "discard" ),
 			"transitions" => array( "next" => 8, "loopback" => 102 )
 	),
 	104 => array(
 			"name" => "lord4",
  		"description" => clienttranslate('${actplayer} must disable one Lord from each opponent'),
 			"descriptionmyturn" => clienttranslate('${you} must disable one Lord from each opponent'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "selectLord" ),
 			"transitions" => array( "selectLord" => 104, "next" => 8, "zombiePass" => 8, "loopback" => 104 )
 	),
 	105 => array(
 			"name" => "lord5",
  		"description" => clienttranslate('Other players must discard down to 6 Allies'),
 			"descriptionmyturn" => clienttranslate('${you} must discard down to 6 Allies'),
 			"type" => "multipleactiveplayer",
  		"action" => "stLord5",
  		"possibleactions" => array( "discard" ),
 			"transitions" => array( "next" => 8, "loopback" => 105 )
 	),
 	107 => array(
 			"name" => "lord7",
  		"description" => clienttranslate('${actplayer} must choose a player to steal a Monster token from'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a player to steal a Monster token from'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "chooseMonsterTokens" ),
 			"transitions" => array( "next" => 8, "zombiePass" => 8, "loopback" => 107 )
 	),
 	116 => array(
 			"name" => "lord16",
  		"description" => clienttranslate('${actplayer} must choose a Council stack to add to their hand'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a Council stack to add to your hand'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "requestSupport" ),
 			"transitions" => array( "requestSupport" => 8, "zombiePass" => 8, "loopback" => 116 )
 	),
 	119 => array(
 			"name" => "lord19",
  		"description" => clienttranslate('${actplayer} may swap a Location for an available one'),
 			"descriptionmyturn" => clienttranslate('${you} may choose a Location you control to swap with an available one'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "chooseLocation", "pass" ),
 			"transitions" => array( "chooseLocation" => 1192, "pass" => 8, "zombiePass" => 8, "loopback" => 119 )
 	),
 	1192 => array(
 			"name" => "lord19b",
  		"description" => clienttranslate('${actplayer} may swap a Location for an available one'),
 			"descriptionmyturn" => clienttranslate('${you} may choose an available Location to gain'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "chooseLocation", "pass" ),
 			"transitions" => array( "chooseLocation" => 8, "locationEffectBlackSmokers" => 17, "pass" => 8, "zombiePass" => 8, "loopback" => 1192 )
 	),
 	122 => array(
 			"name" => "lord22",
  		"description" => clienttranslate('${actplayer} may recruit a second Lord for 5 Pearls'),
 			"descriptionmyturn" => clienttranslate('${you} may recruit a second Lord for 5 Pearls'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "recruit", "pass" ),
 			"transitions" => array( "recruit" => 14, "pass" => 8, "zombiePass" => 8, "loopback" => 122 )
 	),
 	123 => array(
 			"name" => "lord23",
  		"description" => clienttranslate('${actplayer} may discard a Lord to gain one from the Court'),
 			"descriptionmyturn" => clienttranslate('${you} may discard a Lord to gain one from the Court'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "selectLord", "pass" ),
 			"transitions" => array( "selectLord" => 1232, "pass" => 8, "zombiePass" => 8, "loopback" => 123 )
 	),
 	1232 => array(
 			"name" => "lord23b",
  		"description" => clienttranslate('${actplayer} may swap a Lord with one from the Court'),
 			"descriptionmyturn" => clienttranslate('${you} must choose a Lord from the Court to gain'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "recruit" ),
 			"transitions" => array( "recruit" => 14, "zombiePass" => 8, "loopback" => 1232 )
 	),
 	126 => array(
 			"name" => "lord26",
  		"description" => clienttranslate('${actplayer} may discard a Lord to gain one from the top of the deck'),
 			"descriptionmyturn" => clienttranslate('${you} may discard a Lord to gain one from the top of the deck'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "selectLord", "pass" ),
 			"transitions" => array( "selectLord" => 14, "pass" => 8, "zombiePass" => 8, "loopback" => 126 )
 	),

 	112 => array(
 			"name" => "lord12",
  		"description" => clienttranslate('${actplayer} may discard 1 Ally to gain 2 Pearls'),
 			"descriptionmyturn" => clienttranslate('${you} may discard 1 Ally to gain 2 Pearls'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "selectAlly", "pass" ),
 			"transitions" => array( "return_2" => 2, "return_3" => 3, "return_32" => 32,
  										"return_7" => 7, "return_71" => 71, "return_72" => 72, "return_9" => 9, "return_11" => 11,
  										"return_12" => 12, "return_13" => 13, "return_15" => 15, "return_16" => 16, "return_18" => 18, "zombiePass" => 8, "loopback" => 112 )
 	),
 	117 => array(
 			"name" => "lord17",
  		"description" => clienttranslate('${actplayer} may discard 1 stack from the Council'),
 			"descriptionmyturn" => clienttranslate('${you} may discard 1 stack from the Council'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "requestSupport", "pass" ),
 			"transitions" => array( "return_2" => 2, "return_3" => 3, "return_32" => 32,
  										"return_7" => 7, "return_71" => 71, "return_72" => 72, "return_9" => 9, "return_11" => 11,
  										"return_12" => 12, "return_13" => 13, "return_15" => 15, "return_16" => 16, "return_18" => 18, "zombiePass" => 8, "loopback" => 117 )
 	),
 	121 => array(
 			"name" => "lord21",
  		"description" => clienttranslate('${actplayer} may discard and replace a Lord from the Court'),
 			"descriptionmyturn" => clienttranslate('${you} may discard and replace a Lord from the Court'),
 			"type" => "activeplayer",
  		"possibleactions" => array( "recruit", "pass" ),
 			"transitions" => array( "return_2" => 2, "return_3" => 3, "return_32" => 32,
  										"return_7" => 7, "return_71" => 71, "return_72" => 72, "return_9" => 9, "return_11" => 11,
  										"return_12" => 12, "return_13" => 13, "return_15" => 15, "return_16" => 16, "return_18" => 18, "zombiePass" => 8, "loopback" => 121 )
 	),

	98 => array(
 		"name" => "finalScoring",
 		"description" => clienttranslate("Final scoring"),
  		"descriptionmyturn" => clienttranslate("Final scoring"),
 		"type" => "game",
 		"action" => "stFinalScoring",
 		"transitions" => array( "" => 99 )
 ),

 	// Final state.
 	// Please do not modify (and do not overload action/args methods).
 	99 => array(
  		"name" => "gameEnd",
  		"description" => clienttranslate("End of game"),
  		"type" => "manager",
  		"action" => "stGameEnd",
  		"args" => "argGameEnd"
 	)

);
