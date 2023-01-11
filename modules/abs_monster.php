<?php

class Monster {
  public static function setup() {
    $sql = "INSERT INTO monster (`value`) VALUES ";
    $values = array();

    // 2 of value 4, 9 of value 3, 9 of value 2
    for ($j=0; $j<2; $j++) $values[] = "(4)";
    for ($j=0; $j<9; $j++) $values[] = "(3)";
    for ($j=0; $j<9; $j++) $values[] = "(2)";

    $sql .= implode(",", $values);

    Abyss::DbQuery( $sql );
  }

  public function typedMonster(array $dbResult) {
    $dbResult['monster_id'] = intval($dbResult['monster_id']);
    $dbResult['value'] = intval($dbResult['value']);
    $dbResult['place'] = intval($dbResult['place']);

    return $dbResult;
  }

  public function typedMonsters(array $dbResults) {
    return array_values(array_map(fn($dbResult) => self::typedMonster($dbResult), $dbResults));
  }

  public static function draw(int $player_id) {
    $monster = self::typedMonster(Abyss::getObject( "SELECT * FROM monster WHERE place = 0 ORDER BY RAND() LIMIT 1"));
    if (isset($monster)) {
      self::giveToPlayer( $player_id, $monster['monster_id'] );
      Abyss::DbQuery( "UPDATE monster SET place = ".(-1 * $player_id)." WHERE monster_id = " . $monster['monster_id'] );
      $monster['place'] = -1 * $player_id;
    }
    return $monster;
  }

  public static function getDeckSize() {
    return Abyss::getValue( "SELECT COUNT(*) FROM monster WHERE place = 0" );
  }

  public static function giveToPlayer(int $player_id, int $monster_id) {
    Abyss::DbQuery( "UPDATE monster SET place = ".(-1 * $player_id)." WHERE monster_id = " . $monster_id );
  }

  public static function getPlayerHandSize(int $player_id) {
    return intval(Abyss::getValue("SELECT COUNT(*) FROM monster WHERE place = -" . $player_id));
  }

  public static function getPlayerHand(int $player_id) {
    return self::typedMonsters(Abyss::getCollection( "SELECT * FROM monster WHERE place = -" . $player_id));
  }
}
