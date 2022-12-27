<?php

require_once('php/objects/loot.php');

class LootManager {
  public static function setup() {
    $sql = "INSERT INTO loot (`value`) VALUES ";

    $sqlParts = [];

    for ($value = 3; $value <= 7; $value++ ){
      for ($j=0; $j<$value; $j++) {
        $sqlParts[] = "($value)";
      }
    }

    Abyss::DbQuery($sql . implode(', ', $sqlParts));
  }

  public function typedLoots(array $dbResults) {
    return array_values(array_map(fn($dbResult) => new Loot($dbResult), $dbResults));
  }

  public static function draw(int $locationId) {
    $loot = new Loot(Abyss::getObject("SELECT * FROM loot WHERE location_id IS NULL ORDER BY RAND() LIMIT 1"));
    Abyss::DbQuery("UPDATE loot SET location_id = $locationId WHERE id = " . $loot->id);
    $loot->locationId = $locationId;
    return $loot;
  }

  public static function getLootOnLocation(int $locationId) {
    return self::typedLoots(Abyss::getCollection( "SELECT * FROM loot WHERE location_id = $locationId"));
  }

  public static function discard(int $locationId, int $value) {
    Abyss::DbQuery( "UPDATE loot SET location_id = -1 WHERE location_id = $locationId AND `value` = $value" );
  }
}
