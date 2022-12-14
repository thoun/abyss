<?php

class Monster
{
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

  public static function draw( $player_id ) {
    $monster = Abyss::getObject( "SELECT * FROM monster WHERE place = 0 ORDER BY RAND() LIMIT 1" );
    if (isset($monster)) {
      self::giveToPlayer( $player_id, $monster['monster_id'] );
      Abyss::DbQuery( "UPDATE monster SET place = ".(-1 * $player_id)." WHERE monster_id = " . $monster['monster_id'] );
      $monster['place'] = -1 * $player_id;
    }
    return $monster;
  }

  public static function getDeckSize( ) {
    return Abyss::getValue( "SELECT COUNT(*) FROM monster WHERE place = 0" );
  }

  public static function giveToPlayer( $player_id, $monster_id ) {
    Abyss::DbQuery( "UPDATE monster SET place = ".(-1 * $player_id)." WHERE monster_id = " . $monster_id );
  }

  public static function getPlayerHandSize( $player_id ) {
    return Abyss::getValue( "SELECT COUNT(*) FROM monster WHERE place = -" . $player_id );
  }

  public static function getPlayerHand( $player_id ) {
    return Abyss::getCollection( "SELECT * FROM monster WHERE place = -" . $player_id );
  }
}
