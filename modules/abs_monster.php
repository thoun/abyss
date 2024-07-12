<?php

class Monster {
  public static $game;

  public static function init( $theGame ) {
    self::$game = $theGame;
  }

  public static function setup(bool $leviathanExpansion) {
    $sql = "INSERT INTO monster (`value`) VALUES ";
    $values = [];

    // 2 of value 4, 9 of value 3, 9 of value 2
    for ($j=0; $j<2; $j++) $values[] = "(4)";
    for ($j=0; $j<9; $j++) $values[] = "(3)";
    for ($j=0; $j<9; $j++) $values[] = "(2)";

    $sql .= implode(",", $values);

    Abyss::DbQuery( $sql );

    if ($leviathanExpansion) {
      $sql = "INSERT INTO monster (`effect`, `place`) VALUES ";
      $values = [];
  
      for ($j=0; $j<7; $j++) $values[] = "(1, 1)"; // 2 pearls
      for ($j=0; $j<4; $j++) $values[] = "(2, 1)"; // 3 pearls
      for ($j=0; $j<4; $j++) $values[] = "(3, 1)"; // key
      for ($j=0; $j<4; $j++) $values[] = "(4, 1)"; // ally
  
      $sql .= implode(",", $values);
  
      Abyss::DbQuery( $sql );
    }
  }

  public static function typedMonster(array $dbResult) {
    $dbResult['monster_id'] = intval($dbResult['monster_id']);
    $dbResult['type'] = $dbResult['effect'] !== null ? 1 : 0;
    $dbResult['value'] = intval($dbResult['value']);
    $dbResult['place'] = intval($dbResult['place']);
    $dbResult['effect'] = array_key_exists('effect', $dbResult) && $dbResult['effect'] != null ? intval($dbResult['effect']) : null;

    return $dbResult;
  }

  public static function onlyId(array $card) {
      return [
        'monster_id' => $card['monster_id'],
        'type' => $card['type'],
        'place' => $card['place'],
      ];
  }

  public static function onlyIds(array $cards) {
      return array_map(fn($card) => self::onlyId($card), $cards);
  }

  public static function typedMonsters(array $dbResults) {
    return array_values(array_map(fn($dbResult) => self::typedMonster($dbResult), $dbResults));
  }

  public static function draw(int $player_id, int $deck = 0) {
    $monster = self::typedMonster(self::$game->getObject( "SELECT * FROM monster WHERE place = $deck ORDER BY RAND() LIMIT 1"));
    if (isset($monster)) {
      self::giveToPlayer( $player_id, $monster['monster_id'] );
      Abyss::DbQuery( "UPDATE monster SET place = ".(-1 * $player_id)." WHERE monster_id = " . $monster['monster_id'] );
      $monster['place'] = -1 * $player_id;
    }
    return $monster;
  }

  public static function getDeckSize(int $deck = 0) {
    return Abyss::getValue( "SELECT COUNT(*) FROM monster WHERE place = $deck" );
  }

  public static function giveToPlayer(int $player_id, int $monster_id) {
    Abyss::DbQuery( "UPDATE monster SET place = ".(-1 * $player_id)." WHERE monster_id = " . $monster_id );
  }

  public static function getPlayerHandSize(int $player_id) {
    return intval(Abyss::getValue("SELECT COUNT(*) FROM monster WHERE place = -" . $player_id));
  }

  public static function getPlayerHand(int $player_id) {
    return self::typedMonsters(self::$game->getCollection( "SELECT * FROM monster WHERE place = -" . $player_id));
  }

  public static function get(int $monster_id ) {
    return self::typedMonster(self::$game->getObject( "SELECT * FROM monster WHERE monster_id = $monster_id" ));
  }
}
