<?php

class Location
{
  public static $game;

  public static function init( $theGame ) {
    self::$game = $theGame;
  }

  public static function setup(bool $krakenExpansion) {

    $sql = "INSERT INTO location (`location_id`) VALUES
      ( 1 ),
      ( 2 ),
      ( 3 ),
      ( 4 ),
      ( 5 ),
      ( 6 ),
      ( 7 ),
      ( 8 ),
      ( 9 ),
      (10 ),
      (11 ),
      (12 ),
      (13 ),
      (14 ),
      (15 ),
      (16 ),
      (17 ),
      (18 ),
      (19 ),
      (20 )
    ";
    Abyss::DbQuery( $sql );

    // Reveal the top one
    self::draw();
  }

  public function typedLocation(array $dbResult) {
    $dbResult['location_id'] = intval($dbResult['location_id']);
    $dbResult['place'] = intval($dbResult['place']);

    return $dbResult;
  }

  public function typedLocations(array $dbResults) {
    return array_values(array_map(fn($dbResult) => self::typedLocation($dbResult), $dbResults));
  }

  public static function draw() {
    $location = self::typedLocation(Abyss::getObject( "SELECT * FROM location WHERE place = 0 ORDER BY RAND() LIMIT 1"));
    if (! $location) return null;
    Abyss::DbQuery( "UPDATE location SET place = 1 WHERE location_id = $location[location_id]" );
    $location["place"] = 1;
    return self::injectTextSingle($location);
  }

  public static function getAvailable() {
    return self::injectText(Abyss::getCollection( "SELECT * FROM location WHERE place = 1" ));
  }

  public static function getDeck() {
    return self::injectText(Abyss::getCollection( "SELECT * FROM location WHERE place = 0" ));
  }

  public static function get( $location_id ) {
    return self::injectTextSingle(Abyss::getObject( "SELECT * FROM location WHERE location_id = $location_id" ));
  }

  public static function getDeckSize() {
    return intval(Abyss::getValue("SELECT COUNT(*) FROM location WHERE place = 0"));
  }

  public static function getPlayerHand( $player_id ) {
    return self::injectText(Abyss::getCollection( "SELECT * FROM location WHERE place = -" . $player_id . "" ));
  }

  public static function getAllOpponents( $player_id ) {
    return self::injectText(Abyss::getCollection( "SELECT * FROM location WHERE place != -" . $player_id . " AND place < 0" ));
  }

  public static function baseScore( $location_id ) {
    $base_scores = array(
      1 => 5,
      2 => 6,
      3 => 4,
      4 => 6,
      5 => 7,
      6 => 5,
      7 => 3,
      8 => 0,
      9 => 0,
      10 => 0,
      11 => 4,
      12 => 0,
      13 => 0,
      14 => 15,
      15 => 5,
      16 => 0,
      17 => 0,
      18 => 3,
      19 => 3,
      20 => 20,
    );
    return isset($base_scores[$location_id]) ? $base_scores[$location_id] : 0;
  }

  public static function factionScore( $location_id, $lords, $allies ) {
    $faction_scores = array(
      1 => array(2, 2, "lord"),
      2 => array(2, 0, "lord"),
      3 => array(3, 0, "ally"),
      4 => array(2, 4, "lord"),
      5 => array(2, 1, "lord"),
      6 => array(2, 3, "lord"),
      7 => array(3, 2, "ally"),
      11 => array(3, 4, "ally"),
      15 => array(3, 1, "ally"),
      19 => array(3, 3, "ally"),
    );
    $score = 0;
    if (isset($faction_scores[$location_id])) {
      $faction_score = $faction_scores[$location_id];
      $list = null;
      if ($faction_score[2] == "lord") {
        $list = $lords;
      } else {
        $list = $allies;
      }
      foreach ($list as $card) {
        if (isset($card["faction"]) && $card["faction"] == $faction_score[1]) {
          $score += $faction_score[0];
        }
      }
    }
    return $score;
  }

  public static function bonusScore( $location_id, $lords, $allies ) {
    switch ($location_id) {
      case 8; // 2$ for each Guild you have at least 1 Lord from.
        $guilds = array();
        foreach ($lords as $lord) {
          if (isset($lord["faction"])) {
            $guilds[$lord["faction"]] = 1;
          } else {
            // Use 99 for Ambassadors
            $guilds[99] = 1;
          }
        }
        return count($guilds) * 2;
      case 12; // $ = The number of Influence Points of your weakest Lord X2.
        $min = 0;
        foreach ($lords as $lord) {
          if ($min == 0 || $lord["points"] < $min) {
            $min = $lord["points"];
          }
        }
        return $min * 2;
      case 13; // $ = The number of Influence Points of your strongest Lord.
        $max = 0;
        foreach ($lords as $lord) {
          if ($lord["points"] > $max) {
            $max = $lord["points"];
          }
        }
        return $max;
      case 14; // --- minus the number of Lords you have.
        return -1 * count($lords);
      case 16; // 3$ for each of your Lords with 1 or more Keys.
        $score = 0;
        foreach ($lords as $lord) {
          if ($lord["keys"] >= 1) {
            $score += 3;
          }
        }
        return $score;
      case 17; // 3$ for each of your Lords without a Key.
        $score = 0;
        foreach ($lords as $lord) {
          if ($lord["keys"] == 0) {
            $score += 3;
          }
        }
        return $score;
      case 18; // --- + the sum of your weakest affiliated Ally from each Race.
        $min = array();
        foreach ($allies as $a) {
          if (!isset($min[$a["faction"]]) || $min[$a["faction"]] > $a["value"]) {
            $min[$a["faction"]] = $a["value"];
          }
        }
        $score = 0;
        foreach ($min as $m) {
          $score += $m;
        }
        return $score;
      case 20; // --- minus the number of affiliated Allies you have.
        return -1 * count($allies);
      default;
        return 0;
    }
  }

  public static function score( $location_id, $lords, $allies ) {
    return self::baseScore( $location_id ) + self::factionScore( $location_id, $lords, $allies ) + self::bonusScore( $location_id, $lords, $allies );
  }

  public static function injectText( $locs ) {
    $result = array();
    foreach ($locs as $l) {
      $result[] = self::injectTextSingle( $l );
    }
    return $result;
  }

  public static function injectTextSingle( $loc ) {
    $loc = self::typedLocation($loc);
    $loc["name"] = self::$game->locations[$loc["location_id"]]["name"];
    $loc["desc"] = self::$game->locations[$loc["location_id"]]["desc"];
    return $loc;
  }
}
