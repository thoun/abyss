<?php

require_once('php/objects/leviathan.php');

class LeviathanManager {
  public static function setup() {
    $sql = "INSERT INTO leviathan (`id`) VALUES ";

    $sqlParts = [];

    for ($value = 1; $value <= 20; $value++ ){
      $sqlParts[] = "($value)";
    }

    Abyss::DbQuery($sql . implode(', ', $sqlParts));
  }

  public function typedLeviathans(array $dbResults, $game) {
    return array_values(array_map(fn($dbResult) => new Leviathan($dbResult, $game->LEVIATHANS), $dbResults));
  }

  public static function draw($game, int $slot) {
    $leviathan = new Leviathan(Abyss::getObject("SELECT * FROM leviathan WHERE place = 0 ORDER BY RAND() LIMIT 1"), $game->LEVIATHANS);
    Abyss::DbQuery("UPDATE leviathan SET place = $slot WHERE id = " . $leviathan->id);
    $leviathan->place = $slot;
    return $leviathan;
  }

  public static function getVisibleLeviathans($game) {
    return self::typedLeviathans(Abyss::getCollection( "SELECT * FROM leviathan WHERE place > 0"), $game);
  }

  public static function isSlotFree(int $slot) {
    return intval(Abyss::getValue("SELECT COUNT(*) FROM leviathan WHERE place = $slot")) == 0;
  }

  

  public static function discard(int $id, int $playerId) {
    Abyss::DbQuery("UPDATE leviathan SET place = -$playerId WHERE id = $id");
  }
}
