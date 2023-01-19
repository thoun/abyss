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
 * gameoptions.inc.php
 *
 * Abyss game options description
 *
 * In this file, you can define your game options (= game variants).
 *
 * Note: If your game has no variant, you don't have to modify this file.
 *
 * Note²: All options defined in this file should have a corresponding "game state labels"
 *        with the same ID (see "initGameStateLabels" in abyss.game.php)
 *
 * !! It is not a good idea to modify this file when a game is running !!
 *
 */

 require_once("modules/php/constants.inc.php");

$game_options = [

    KRAKEN_EXPANSION => [
        'name' => totranslate('Kraken expansion'),
        'values' => [
            1 => [
                'name' => totranslate('Disabled'),
            ],
            2 => [
                'name' => totranslate('Enabled'),
                'tmdisplay' => totranslate('Kraken expansion'),
                'nobeginner' => true,
                'alpha' => true,
            ],
        ],
        'default' => 1,
    ],

    /*LEVIATHAN_EXPANSION => [
        'name' => totranslate('Leviathan expansion'),
        'values' => [
            1 => [
                'name' => totranslate('Disabled'),
            ],
            2 => [
                'name' => totranslate('Enabled'),
                'tmdisplay' => totranslate('Leviathan expansion'),
                'nobeginner' => true,
                'alpha' => true,
            ],
        ],
        'default' => 1,
    ],*/

];

$game_preferences = [
    100 => [
        'name' => totranslate('Use playmat'),
        'needReload' => true,
        'values' => [
            1 => [ 'name' => totranslate( 'Yes' ), 'cssPref' => 'playmat_on' ],
            2 => [ 'name' => totranslate( 'No' ), 'cssPref' => 'playmat_off' ],
        ],
        'default' => 1,
    ],
];
