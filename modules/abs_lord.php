<?php

class Lord
{
  const PLACE_DECK = 0;
	const PLACE_SLOT_1 = 1;
	const PLACE_SLOT_2 = 2;
	const PLACE_SLOT_3 = 3;
	const PLACE_SLOT_4 = 4;
	const PLACE_SLOT_5 = 5;
	const PLACE_SLOT_6 = 6;

	const FACTION_PURPLE = 0;
	const FACTION_RED = 1;
	const FACTION_YELLOW = 2;
	const FACTION_GREEN = 3;
	const FACTION_BLUE = 4;

	const EFFECT_NONE = 0;
	const EFFECT_ONCE = 1;
	const EFFECT_PASSIVE = 2;
	const EFFECT_TURN = 3;

  public static $game;

  public static function init( $theGame ) {
    self::$game = $theGame;
  }

  public static function setup(bool $krakenExpansion) {
    $sql = "INSERT INTO lord (lord_id, points, `keys`, cost, diversity, faction, effect) VALUES
      ( 1, 4, 1, 10, 2, ".self::FACTION_RED.", ".self::EFFECT_PASSIVE."),
      ( 2, 7, 0,  6, 3, ".self::FACTION_RED.", ".self::EFFECT_ONCE."),
      ( 3, 7, 0,  7, 2, ".self::FACTION_RED.", ".self::EFFECT_ONCE."),
      ( 4, 6, 0, 10, 1, ".self::FACTION_RED.", ".self::EFFECT_ONCE."),
      ( 5, 4, 1,  8, 1, ".self::FACTION_RED.", ".self::EFFECT_PASSIVE."),
      ( 6, 4, 1,  6, 3, ".self::FACTION_RED.", ".self::EFFECT_PASSIVE."),
      ( 7, 6, 0,  8, 2, ".self::FACTION_RED.", ".self::EFFECT_ONCE."),

      ( 8, 5, 1,  6, 3, ".self::FACTION_GREEN.", ".self::EFFECT_PASSIVE."),
      ( 9, 9, 0, 10, 3, ".self::FACTION_GREEN.", ".self::EFFECT_ONCE."),
      (10, 9, 0,  8, 1, ".self::FACTION_GREEN.", ".self::EFFECT_ONCE."),
      (11, 5, 1, 10, 2, ".self::FACTION_GREEN.", ".self::EFFECT_PASSIVE."),
      (12, 5, 1,  8, 1, ".self::FACTION_GREEN.", ".self::EFFECT_TURN."),
      (13, 9, 0,  6, 3, ".self::FACTION_GREEN.", ".self::EFFECT_ONCE."),

      (14, 5, 1,  6, 3, ".self::FACTION_PURPLE.", ".self::EFFECT_PASSIVE."),
      (15, 8, 0,  8, 1, ".self::FACTION_PURPLE.", ".self::EFFECT_ONCE."),
      (16, 9, 0,  6, 3, ".self::FACTION_PURPLE.", ".self::EFFECT_ONCE."),
      (17, 5, 1,  8, 2, ".self::FACTION_PURPLE.", ".self::EFFECT_TURN."),
      (18, 5, 1,  7, 1, ".self::FACTION_PURPLE.", ".self::EFFECT_PASSIVE."),
      (19, 9, 0, 10, 1, ".self::FACTION_PURPLE.", ".self::EFFECT_ONCE."),
      (20, 6, 1, 10, 3, ".self::FACTION_PURPLE.", ".self::EFFECT_PASSIVE."),

      (21, 5, 1,  6, 3, ".self::FACTION_BLUE.", ".self::EFFECT_TURN."),
      (22, 6, 0, 10, 1, ".self::FACTION_BLUE.", ".self::EFFECT_ONCE."),
      (23, 6, 0, 12, 3, ".self::FACTION_BLUE.", ".self::EFFECT_ONCE."),
      (24, 5, 1,  8, 1, ".self::FACTION_BLUE.", ".self::EFFECT_PASSIVE."),
      (25, 5, 1, 10, 2, ".self::FACTION_BLUE.", ".self::EFFECT_PASSIVE."),
      (26, 6, 0,  8, 3, ".self::FACTION_BLUE.", ".self::EFFECT_ONCE."),

      (27, 6, 1, 6, 3, ".self::FACTION_YELLOW.", ".self::EFFECT_NONE."),
      (28, 6, 1, 7, 2, ".self::FACTION_YELLOW.", ".self::EFFECT_NONE."),
      (29, 6, 1, 8, 1, ".self::FACTION_YELLOW.", ".self::EFFECT_NONE."),
      (30, 10, 0, 8, 2, ".self::FACTION_YELLOW.", ".self::EFFECT_NONE."),
      (31, 11, 0, 9, 3, ".self::FACTION_YELLOW.", ".self::EFFECT_NONE."),
      (32, 12, 0, 10, 1, ".self::FACTION_YELLOW.", ".self::EFFECT_NONE."),

      (33, 4, 0, 10, 5, NULL, ".self::EFFECT_ONCE."),
      (34, 5, 0, 10, 5, NULL, ".self::EFFECT_ONCE."),
      (35, 3, 0, 10, 5, NULL, ".self::EFFECT_ONCE.")
    ";

    if ($krakenExpansion) {
      $sql .= ",
        (101, 5, 1,  7, 1, NULL, ".self::EFFECT_TURN."),
        (102, 6, 1,  7, 1, NULL, ".self::EFFECT_PASSIVE."),
        (103, 5, 1,  7, 1, NULL, ".self::EFFECT_PASSIVE."),
        (104, 8, 0,  7, 1, NULL, ".self::EFFECT_ONCE."),
        (105, 7, 1,  7, 1, NULL, ".self::EFFECT_PASSIVE."),
        (106, 4, 0,  5, 2, NULL, ".self::EFFECT_PASSIVE."),
        (107, 4, 0,  5, 2, NULL, ".self::EFFECT_PASSIVE."),  
        (108, 4, 0,  5, 2, NULL, ".self::EFFECT_PASSIVE."),

        (109, 5, 1,  9, 2, ".self::FACTION_GREEN.", ".self::EFFECT_PASSIVE."),
        (110, 7, 0, 10, 2, ".self::FACTION_GREEN.", ".self::EFFECT_ONCE."),
  
        (111, 5, 1,  9, 2, ".self::FACTION_PURPLE.", ".self::EFFECT_PASSIVE."),
        (112, 7, 0,  7, 1, ".self::FACTION_PURPLE.", ".self::EFFECT_ONCE."),

        (113, 4, 1,  9, 2, ".self::FACTION_RED.", ".self::EFFECT_PASSIVE."),
        (114, 5, 0,  9, 3, ".self::FACTION_RED.", ".self::EFFECT_ONCE."),
  
        (115, 5, 1,  7, 2, ".self::FACTION_BLUE.", ".self::EFFECT_TURN."),
        (116, 8, 0,  9, 2, ".self::FACTION_BLUE.", ".self::EFFECT_ONCE."),
  
        (117, 7, 1,  9, 2, ".self::FACTION_YELLOW.", ".self::EFFECT_NONE."),
        (118,13, 0, 12, 1, ".self::FACTION_YELLOW.", ".self::EFFECT_NONE.")
      ";
    }

    Abyss::DbQuery( $sql );

    self::refill();
  }

  public function typedLord(array $dbResult) {
    $dbResult['lord_id'] = intval($dbResult['lord_id']);
    $dbResult['points'] = intval($dbResult['points']);
    $dbResult['keys'] = intval($dbResult['keys']);
    $dbResult['cost'] = intval($dbResult['cost']);
    $dbResult['diversity'] = intval($dbResult['diversity']);
    $dbResult['used'] = boolval($dbResult['used']);
    $dbResult['turned'] = boolval($dbResult['turned']);
    $dbResult['faction'] = $dbResult['faction'] == null ? null : intval($dbResult['faction']);
    $dbResult['place'] = intval($dbResult['place']);
    $dbResult['location'] = $dbResult['location'] == null ? null : intval($dbResult['location']);

    return $dbResult;
  }

  public function typedLords(array $dbResults) {
    return array_values(array_map(fn($dbResult) => self::typedLord($dbResult), $dbResults));
  }

  public static function getSlots() {
    return array_values(self::injectText(Abyss::getCollection( "SELECT * FROM lord WHERE place >= 1 AND place <= 6 ORDER BY place ASC" )));
  }

  public static function getDeckSize() {
    return intval(Abyss::getValue( "SELECT COUNT(*) FROM lord WHERE place = 0"));
  }

  public static function getInTrack(int $lord_id ) {
    return self::injectTextSingle(Abyss::getObject( "SELECT * FROM lord WHERE lord_id = $lord_id AND place >= 1 AND place <= 6" ));
  }

  public static function get(int $lord_id ) {
    return self::injectTextSingle(Abyss::getObject( "SELECT * FROM lord WHERE lord_id = $lord_id" ));
  }

  public static function giveToPlayer(int $lord_id, int $player_id ) {
    Abyss::DbQuery( "UPDATE lord SET place = ".(-1 * $player_id)." WHERE lord_id = $lord_id" );
  }

  public static function freeLord(int $lord_id) {
    Abyss::DbQuery( "UPDATE lord SET location = NULL WHERE lord_id = $lord_id" );
  }

  public static function playerProtected(int $player_id ) {
    return self::playerHas( 14, $player_id );
  }

  public static function playerHas(int $lord_id, int $player_id ) {
    return intval(Abyss::getValue( "SELECT COUNT(*) FROM lord WHERE place = -$player_id AND location IS NULL AND NOT turned AND lord_id = $lord_id" )) > 0;
  }

  public static function opponentHas(int $lord_id, int $player_id ) {
    return intval(Abyss::getValue( "SELECT COUNT(*) FROM lord WHERE place != -$player_id AND place < 0 AND location IS NULL AND NOT turned AND lord_id = $lord_id" )) > 0;
  }

  public static function moveToRight( ) {
    // Lords should be in slots 1, 2, 3, 4, 5, 6 -- any gaps, move right
    $lords = array_reverse(self::getSlots());
    $max = 6;
    foreach ($lords as &$lord) {
      $lord["place"] = $max;
      Abyss::DbQuery( "UPDATE lord SET place = $max WHERE lord_id = $lord[lord_id]" );
      $max--;
    }
    return array_values(self::injectText($lords));
  }

  public static function refill( ) {
    // Lords should be in slots 1, 2, 3, 4, 5, 6 -- any gaps, move right
    $num = 6 - count(self::getSlots());
    if ($num > 0) {
      $lords = Abyss::getCollection( "SELECT * FROM lord WHERE place = 0 ORDER BY RAND() LIMIT $num" );
      $slot = 1;
      foreach ($lords as $k => $v) {
        Abyss::DbQuery( "UPDATE lord SET place = $slot WHERE lord_id = $k" );
        $lords[$k]["place"] = $slot;
        $slot++;
      }
      return array_values(self::injectText($lords));
    }
    return [];
  }

  public static function draw( ) {
    // Lords should be in slots 1, 2, 3, 4, 5, 6 -- any gaps, move right
    $num = count(self::getSlots());
    if ($num == 6) {
      throw new BgaVisibleSystemException( "Not enough room to draw a Lord." );
    }
    $slot = 6 - $num;
    if (self::getDeckSize() == 0) {
      return null;
    }
    return self::putRandom( $slot );
  }

  public static function putRandom(int $slot ) {
    $lord = Abyss::getObject( "SELECT * FROM lord WHERE place = 0 ORDER BY RAND() LIMIT 1" );
    Abyss::DbQuery( "UPDATE lord SET place = $slot WHERE lord_id = $lord[lord_id]" );
    $lord["place"] = $slot;
    return self::injectTextSingle($lord);
  }

  public static function getPlayerHand(int $player_id ) {
    return array_values(self::injectText(Abyss::getCollection( "SELECT * FROM lord WHERE place = -" . $player_id . "" )));
  }

  public static function getKeys(int $player_id ) {
    return Abyss::getValue( "SELECT SUM(`keys`) FROM lord WHERE place = -" . $player_id . " AND NOT turned AND location IS NULL" );
  }

  public static function disable(int $lord_id ) {
    Abyss::DbQuery( "UPDATE lord SET turned = 1 WHERE lord_id = $lord_id" );
  }

  public static function discard(int $lord_id ) {
    Abyss::DbQuery( "UPDATE lord SET place = 10 WHERE lord_id = $lord_id" );
  }

  public static function use(int $lord_id ) {
    Abyss::DbQuery( "UPDATE lord SET used = 1 WHERE lord_id = $lord_id" );
  }

  public static function setUnused( ) {
    Abyss::DbQuery( "UPDATE lord SET used = 0 WHERE 1" );
  }

  public static function injectText(array $lords) {
    return array_map(fn($lord) => self::injectTextSingle($lord), $lords);
  }

  public static function injectTextSingle($lord) {
    if (isset($lord)) {
      $lord = self::typedLord($lord);
      $lord["name"] = self::$game->lords[$lord["lord_id"]]["name"];
      $lord["desc"] = self::$game->lords[$lord["lord_id"]]["desc"];
    }
    return $lord;
  }

  // Get keys: count FREE Lords, which are not turned
}
