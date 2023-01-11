<?php

class Ally {
  public static function setup(bool $krakenExpansion) {
    $sql = "INSERT INTO ally (`faction`, `value`) VALUES ";

    // 6 monsters
    for ($i=0; $i<6; $i++) {
      if ($i > 0) $sql .= ", ";
      $sql .= "(NULL, 0)";
    }

    // For each faction: 5, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 1
    for ($i=0; $i<=4; $i++) {
                             $sql .= ", ($i, 5)";
      for ($j=0; $j<2; $j++) $sql .= ", ($i, 4)";
      for ($j=0; $j<3; $j++) $sql .= ", ($i, 3)";
      for ($j=0; $j<3; $j++) $sql .= ", ($i, 2)";
      for ($j=0; $j<4; $j++) $sql .= ", ($i, 1)";
    }

    if ($krakenExpansion) {
      for ($j=0; $j<2; $j++) $sql .= ", (10, 4)";
      for ($j=0; $j<3; $j++) $sql .= ", (10, 3)";
      for ($j=0; $j<2; $j++) $sql .= ", (10, 2)";
    }

    Abyss::DbQuery( $sql );
  }

  public static function getExploreSlots() {
    return array_values(Abyss::getCollection( "SELECT * FROM ally WHERE place >= 1 AND place <= 5 ORDER BY place ASC" ));
  }

  public function typedAlly(array $dbResult) {
    $dbResult['ally_id'] = intval($dbResult['ally_id']);
    $dbResult['faction'] = $dbResult['faction'] == null ? null : intval($dbResult['faction']);
    $dbResult['value'] = intval($dbResult['value']);
    $dbResult['just_spent'] = boolval($dbResult['just_spent']);
    $dbResult['affiliated'] = boolval($dbResult['affiliated']);
    $dbResult['place'] = intval($dbResult['place']);

    return $dbResult;
  }

  public function typedAllies(array $dbResults) {
    return array_values(array_map(fn($dbResult) => self::typedAlly($dbResult), $dbResults));
  }

  public static function draw() {
    $nextSlot = count(Ally::getExploreSlots()) + 1;
    $ally = self::typedAlly(Abyss::getObject("SELECT * FROM ally WHERE place = 0 ORDER BY RAND() LIMIT 1" ));
    Abyss::DbQuery( "UPDATE ally SET place = $nextSlot WHERE ally_id = " . $ally['ally_id'] );
    $ally['place'] = $nextSlot;
    return $ally;
  }

  public static function getCouncilSlots() {
    return array(
      0 => Abyss::getValue( "SELECT COUNT(*) FROM ally WHERE place = 6 AND faction = 0" ),
      1 => Abyss::getValue( "SELECT COUNT(*) FROM ally WHERE place = 6 AND faction = 1" ),
      2 => Abyss::getValue( "SELECT COUNT(*) FROM ally WHERE place = 6 AND faction = 2" ),
      3 => Abyss::getValue( "SELECT COUNT(*) FROM ally WHERE place = 6 AND faction = 3" ),
      4 => Abyss::getValue( "SELECT COUNT(*) FROM ally WHERE place = 6 AND faction = 4" ),
    );
  }

  public static function drawCouncilSlot( $faction, int $player_id) {
    $allies = Abyss::getCollection( "SELECT * FROM ally WHERE place = 6 AND faction = $faction" );
    Abyss::DbQuery( "UPDATE ally SET place = ".(-1 * $player_id)." WHERE place = 6 AND faction = $faction" );
    return self::typedAllies($allies);
  }

  public static function discardCouncilSlot($faction) {
    $num = intval(Abyss::getValue( "SELECT COUNT(*) FROM ally WHERE place = 6 AND faction = $faction"));
    Abyss::DbQuery( "UPDATE ally SET place = 10 WHERE place = 6 AND faction = $faction" );
    return $num;
  }

  public static function getDeckSize() {
    return intval(Abyss::getValue("SELECT COUNT(*) FROM ally WHERE place = 0"));
  }

  public static function getDiscardSize() {
    return intval(Abyss::getValue("SELECT COUNT(*) FROM ally WHERE place = 10"));
  }

  public static function shuffleDiscard() {
    Abyss::DbQuery( "UPDATE ally SET place = 0 WHERE place = 10" );
    return self::getDeckSize();
  }

  public static function getPlayerHandSize( $player_id ) {
    return intval(Abyss::getValue("SELECT COUNT(*) FROM ally WHERE place = -" . $player_id . " AND NOT affiliated"));
  }

  public static function getPlayerHand( $player_id ) {
    return self::typedAllies(Abyss::getCollection( "SELECT * FROM ally WHERE place = -" . $player_id . " AND NOT affiliated"));
  }

  public static function get(int $ally_id ) {
    return self::typedAlly(Abyss::getObject( "SELECT * FROM ally WHERE ally_id = $ally_id" ));
  }

  public static function getPlayerAffiliated( $player_id ) {
    return self::typedAllies(Abyss::getCollection( "SELECT * FROM ally WHERE place = -" . $player_id . " AND affiliated"));
  }

  public static function getJustSpent() {
    return self::typedAllies(Abyss::getCollection( "SELECT * FROM ally WHERE just_spent"));
  }

  public static function getDiscard() {
    return self::typedAllies(Abyss::getCollection( "SELECT * FROM ally WHERE place = 10"));
  }

  public static function getDiversityAndValue(array $hand, $required ) {
    $value = 0;
    $factions = array();
    $includesRequired = ! isset($required);
    $krakens = 0;
    foreach ($hand as $a) {
      $value += $a["value"];
      if ($a["faction"] == 10) {
        // we do not count krakens in diversity
        $krakens++;
        $includesRequired = true;
      } else {
        $factions[$a["faction"]] = 1;
      }
      if ($a["faction"] == $required) {
        $includesRequired = true;
      }
    }
    return [
      "value" => $value,
      "diversity" => count($factions),
      "includesRequired" => $includesRequired,
      "krakens" => $krakens,
    ];
  }

  public static function removeCardsFromHand(int $player_id, array $ally_ids) {
    Abyss::DbQuery( "UPDATE ally SET just_spent = 0 WHERE 1" );

    if (count($ally_ids) == 0) {
      return array();
    }

    $allies = Abyss::getCollection( "SELECT * FROM ally WHERE place = -" . $player_id . " AND NOT affiliated AND ally_id IN (".implode(",", $ally_ids).")" );

    if (count($allies) != count($ally_ids)) {
      throw new BgaVisibleSystemException( "You do not have those Allies in your hand." );
    }

    // Remove them from the hand
    Abyss::DbQuery( "UPDATE ally SET place = 10, just_spent = 1 WHERE ally_id IN (".implode(",", $ally_ids).")" );

    return $allies;
  }

  public static function affiliate(int $player_id, int $ally_id) {
    Abyss::DbQuery( "UPDATE ally SET place = ".(-1 * $player_id).", affiliated = 1 WHERE ally_id = $ally_id" );
  }

  public static function discard(int $ally_id) {
    Abyss::DbQuery( "UPDATE ally SET place = 10, just_spent = false WHERE ally_id = $ally_id" );
  }
}
