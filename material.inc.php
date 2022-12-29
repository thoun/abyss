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
 * material.inc.php
 *
 * Abyss game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */

$this->locations = array(
  "1" => array( "name" => clienttranslate('Sargasso Silos'), "desc" => clienttranslate('2$ for each of your {farmer} Lords + 5$')),
  "2" => array( "name" => clienttranslate('Hydrozoa Reserves'), "desc" => clienttranslate('2$ for each of your {mage} Lords + 6$')),
  "3" => array( "name" => clienttranslate('The Sanctuary'), "desc" => clienttranslate('3$ for each of your affiliated Allies from the {jellyfish} Race + 4$')),
  "4" => array( "name" => clienttranslate('Parliament'), "desc" => clienttranslate('2$ for each of your {politician} Lords + 6$')),
  "5" => array( "name" => clienttranslate('The Barracks'), "desc" => clienttranslate('2$ for each of your {soldier} Lords + 7$')),
  "6" => array( "name" => clienttranslate('The Dockworks'), "desc" => clienttranslate('2$ for each of your {merchant} Lords + 5$')),
  "7" => array( "name" => clienttranslate('The Sargasso Fields'), "desc" => clienttranslate('3$ for each of your affiliated Allies from the {seahorse} Race + 3$')),
  "8" => array( "name" => clienttranslate('The Abyss'), "desc" => clienttranslate('2$ for each Guild you have at least 1 Lord from.')),
  "9" => array( "name" => clienttranslate('City of Mirrors'), "desc" => clienttranslate('Copies the effect of an opponent\'s Location at the end of the game.')),
  "10" => array( "name" => clienttranslate('Black Smokers'), "desc" => clienttranslate('You may immediately switch this Location with a Location of your choice from the deck.')),
  "11" => array( "name" => clienttranslate('Oceanic Senate Assembly'), "desc" => clienttranslate('3$ for each of your affiliated Allies from the {squid} Race + 4$')),
  "12" => array( "name" => clienttranslate('The Depths'), "desc" => clienttranslate('$ = The number of Influence Points of your weakest Lord X2.')),
  "13" => array( "name" => clienttranslate('The Throne Room'), "desc" => clienttranslate('$ = The number of Influence Points of your strongest Lord.')),
  "14" => array( "name" => clienttranslate('The Jail'), "desc" => clienttranslate('15$ minus the number of Lords you have.')),
  "15" => array( "name" => clienttranslate('The Chasm'), "desc" => clienttranslate('3$ for each of your affiliated Allies from the {crab} Race + 5$')),
  "16" => array( "name" => clienttranslate('The Closed Tower'), "desc" => clienttranslate('3$ for each of your Lords with 1 or more Keys.')),
  "17" => array( "name" => clienttranslate('The Lost Tower'), "desc" => clienttranslate('3$ for each of your Lords without a Key.')),
  "18" => array( "name" => clienttranslate('The Chamber of Allies'), "desc" => clienttranslate('3$ + the sum of your weakest affiliated Ally from each Race.')),
  "19" => array( "name" => clienttranslate('Nest of Giant Clams'), "desc" => clienttranslate('3$ for each of your affiliated Allies from the {shellfish} Race + 3$')),
  "20" => array( "name" => clienttranslate('The Coral Barrier'), "desc" => clienttranslate('20$ minus the number of affiliated Allies you have.')),

  // kraken locations
  "101" => array( "name" => clienttranslate('The Gambling Den'), "desc" => clienttranslate('2$ for each of your Smuggler Lords + 3$')), // TODOTEST
  "102" => array( "name" => clienttranslate('The Kraken’s Lair'), "desc" => clienttranslate('15$ - 3$ for each of your Nebulis.')), // TODOTEST
  "103" => array( "name" => clienttranslate('The Cetacean Graveyard'), "desc" => clienttranslate('Grants immediate access to the Loot deck.')), // TODOTEST
  "104" => array( "name" => clienttranslate('The Abandoned Convoy'), "desc" => clienttranslate('Grants immediate access to the Loot deck.')), // TODOTEST
  "105" => array( "name" => clienttranslate('The Megalodon'), "desc" => clienttranslate('Grants immediate access to the Loot deck.')), // TODOTEST
  "106" => array( "name" => clienttranslate('The Battlefield'), "desc" => clienttranslate('Grants immediate access to the Loot deck.')), // TODOTEST
);

$this->lords = array(
  "1" => array(
    "name" => clienttranslate("The Recruiter"),
    "desc" => clienttranslate("All recruitment costs for your opponents are increased by 2."),
  ),
  "2" => array(
    "name" => clienttranslate("The Jailer"),
    "desc" => clienttranslate("Each of your opponents must discard 1 Ally from their hand."),
  ),
  "3" => array(
    "name" => clienttranslate("The Seeker"),
    "desc" => clienttranslate("Each of your opponents must return 2 Pearls to the Treasury."),
  ),
  "4" => array(
    "name" => clienttranslate("The Assassin"),
    "desc" => clienttranslate("Disable 1 Lord from each opponent. That Lord counts only for points."),
  ),
  "5" => array(
    "name" => clienttranslate("The Commander"),
    "desc" => clienttranslate("Your opponents can no longer hold more than 6 Allies in hand. They must immediately discard any extras."),
  ),
  "6" => array(
    "name" => clienttranslate("The Tamer"),
    "desc" => clienttranslate("When your opponents fight a Monster, they earn the reward from the previous Monster Track space."),
  ),
  "7" => array(
    "name" => clienttranslate("The Hunter"),
    "desc" => clienttranslate("Steal a random Monster token from the opponent of your choice."),
  ),
  "8" => array(
    "name" => clienttranslate("The Ship Master"),
    "desc" => clienttranslate("Gain 1 Pearl for each different Race that you send to the Council."),
  ),
  "9" => array(
    "name" => clienttranslate("The Trader"),
    "desc" => clienttranslate("Gain 3 Pearls."),
  ),
  "10" => array(
    "name" => clienttranslate("The Peddler"),
    "desc" => clienttranslate("Gain 2 Pearls."),
  ),
  "11" => array(
    "name" => clienttranslate("The Landlord"),
    "desc" => clienttranslate("Gain 1 Pearl now and at the start of each of your turns."),
  ),
  "12" => array(
    "name" => clienttranslate("The Slaver"),
    "desc" => clienttranslate("During your turn, you can discard 1 Ally from your hand to gain 2 Pearls."),
  ),
  "13" => array(
    "name" => clienttranslate("The Shopkeeper"),
    "desc" => clienttranslate("Gain 1 Pearl."),
  ),
  "14" => array(
    "name" => clienttranslate("The Shaman"),
    "desc" => clienttranslate("You are protected against the Powers of Military Lords."),
  ),
  "15" => array(
    "name" => clienttranslate("The Invoker"),
    "desc" => clienttranslate("Take an extra turn after this one."),
  ),
  "16" => array(
    "name" => clienttranslate("The Apprentice"),
    "desc" => clienttranslate("Add 1 stack of cards from the Council to your hand."),
  ),
  "17" => array(
    "name" => clienttranslate("The Oracle"),
    "desc" => clienttranslate("During your turn, you may discard 1 stack of cards from the council."),
  ),
  "18" => array(
    "name" => clienttranslate("The Alchemist"),
    "desc" => clienttranslate("When you request support from the Council, add 2 stacks to your hand instead of 1."),
  ),
  "19" => array(
    "name" => clienttranslate("The Illusionist"),
    "desc" => clienttranslate("You can exchange one of your Locations for a different available one."),
  ),
  "20" => array(
    "name" => clienttranslate("The Master of Magic"),
    "desc" => clienttranslate("When you recruit other Lords, affiliate the Ally of your choice from among those used (instead of the lowest value)."),
  ),
  "21" => array(
    "name" => clienttranslate("The Opportunist"),
    "desc" => clienttranslate("During your turn, you may discard a Lord from the Court and replace it with the top one from the deck."),
  ),
  "22" => array(
    "name" => clienttranslate("The Corruptor"),
    "desc" => clienttranslate("You can recruit a second Lord from the Court by paying 5 Pearls instead of its normal cost."),
  ),
  "23" => array(
    "name" => clienttranslate("The Traitor"),
    "desc" => clienttranslate("You can discard one of your other free Lords and replace it with any Lord from the Court."),
  ),
  "24" => array(
    "name" => clienttranslate("The Diplomat"),
    "desc" => clienttranslate("When you recruit, you may use any Races of your choice (you must still respect the number of Races required)."),
  ),
  "25" => array(
    "name" => clienttranslate("The Treasurer"),
    "desc" => clienttranslate("For you, the cost of recruiting Lords is reduced by 2."),
  ),
  "26" => array(
    "name" => clienttranslate("The Schemer"),
    "desc" => clienttranslate("You may discard one of your other free Lords and replace it with the top one from the deck."),
  ),
  "27" => array(
    "name" => clienttranslate("The Keeper"),
    "desc" => ""
  ),
  "28" => array(
    "name" => clienttranslate("The Reaper"),
    "desc" => ""
  ),
  "29" => array(
    "name" => clienttranslate("The Shepherd"),
    "desc" => ""
  ),
  "30" => array(
    "name" => clienttranslate("The Miller"),
    "desc" => ""
  ),
  "31" => array(
    "name" => clienttranslate("The Aquaculturalist"),
    "desc" => ""
  ),
  "32" => array(
    "name" => clienttranslate("The Landowner"),
    "desc" => ""
  ),
  "33" => array(
    "name" => clienttranslate("The Sage"),
    "desc" => clienttranslate("Draw 2 Locations, place one under your control and make the other one available."),
  ),
  "34" => array(
    "name" => clienttranslate("The Hermit"),
    "desc" => clienttranslate("Draw 1 Location and place it under your control."),
  ),
  "35" => array(
    "name" => clienttranslate("The Elder"),
    "desc" => clienttranslate("Draw 3 Locations, place one under your control and make the other two available."),
  ),
  
  // kraken lords
  "101" => array( // TODOTEST
    "name" => clienttranslate("The Ferryman"),
    "desc" => clienttranslate("During your turn, you can discard 1 Nebulis and replace it with 1 Pearl."),
  ),
  "102" => array( // TODOTEST
    "name" => clienttranslate("The Outlaw"),
    "desc" => clienttranslate("When purchasing something, you can use 2 Nebulis."),
  ),
  "103" => array( // TODOTEST
    "name" => clienttranslate("The Counterfeiter"),
    "desc" => clienttranslate("When purchasing something, you can use 1 Nebulis even if you still have Pearls."),
  ),
  "104" => array( // TODO
    "name" => clienttranslate("The Fence"),
    "desc" => clienttranslate("Give 1 of your Nebulis to each opponent."),
  ),
  "105" => array( // TODO
    "name" => clienttranslate("The Fence"),
    "desc" => clienttranslate("At the end of the game, you do not receive any Nebulis for the Krakens you still have in hand."),
  ),
  "106" => array( // TODO
    "name" => clienttranslate("The Watcher"),
    "desc" => clienttranslate("Take the corresponding Sentinel token and place it on a free area. Gain 1 Nebulis."),
  ),
  "107" => array( // TODO
    "name" => clienttranslate("The Vigil"),
    "desc" => clienttranslate("Take the corresponding Sentinel token and place it on a free area. Gain 1 Nebulis."),
  ),
  "108" => array( // TODO
    "name" => clienttranslate("The Lookout"),
    "desc" => clienttranslate("Take the corresponding Sentinel token and place it on a free area. Gain 1 Nebulis."),
  ),
  "109" => array( // TODOTEST
    "name" => clienttranslate("The Shareholder"),
    "desc" => clienttranslate("When an opponent recruits a Lord, gain 1 Pearl."),
  ),
  "110" => array( // TODOTEST
    "name" => clienttranslate("The Inheritor"),
    "desc" => clienttranslate("Gain 5 Pearls."),
  ),
  "111" => array( // TODOTEST
    "name" => clienttranslate("The Hypnotist"),
    "desc" => clienttranslate("During each opponent's turn, you can purchse 2 Allies."),
  ),
  "112" => array( // TODO
    "name" => clienttranslate("The Healer"),
    "desc" => clienttranslate("Take the Ally of your choice from the discard."),
  ),
  "113" => array( // TODO
    "name" => clienttranslate("The Highwayman"),
    "desc" => clienttranslate("When an opponent gains 2 or more Pearls, take 1 Pearl from them."),
  ),
  "114" => array( // TODO
    "name" => clienttranslate("The Executioner"),
    "desc" => clienttranslate("Choose a Race of Allies. Each opponent discards one affiliated Ally from that Race."),
  ),
  "115" => array( // TODO
    "name" => clienttranslate("The Recipient"),
    "desc" => clienttranslate("During your turn, you can add a Lord to a free space of the Court."),
  ),
  "116" => array( // TODO
    "name" => clienttranslate("The Liberator"),
    "desc" => clienttranslate("Free one of your Lords which has been assigned to control a Location."),
  ),
  "117" => array( // TODOTEST
    "name" => clienttranslate("The Grower"),
    "desc" => ""
  ),
  "118" => array( // TODOTEST
    "name" => clienttranslate("The Oyster Farmer"),
    "desc" => ""
  ),
);

$this->factions = array(
  0 => array(
    "ally_name" => clienttranslate( 'Jellyfish' ),
    "lord_name" => clienttranslate( 'Mage' ),
    "colour" => "purple",
  ),
  1 => array(
    "ally_name" => clienttranslate( 'Crab' ),
    "lord_name" => clienttranslate( 'Soldier' ),
    "colour" => "red",
  ),
  2 => array(
    "ally_name" => clienttranslate( 'Seahorse' ),
    "lord_name" => clienttranslate( 'Farmer' ),
    "colour" => "#999900",
  ),
  3 => array(
    "ally_name" => clienttranslate( 'Shellfish' ),
    "lord_name" => clienttranslate( 'Merchant' ),
    "colour" => "green",
  ),
  4 => array(
    "ally_name" => clienttranslate( 'Squid' ),
    "lord_name" => clienttranslate( 'Politician' ),
    "colour" => "blue",
  ),
  // kraken expansion
  10 => array(
    "ally_name" => clienttranslate( 'Kraken' ),
    "lord_name" => clienttranslate( 'Smuggler' ),
    "colour" => "darkgray",
  ),
);
