<?php

require_once('php/objects/leviathan.php');

class LeviathanManager {
  public static $game;

  public static function init( $theGame ) {
    self::$game = $theGame;
  }
  
  public static function setup() {
    $sql = "INSERT INTO leviathan (`id`) VALUES ";

    $sqlParts = [];

    for ($value = 1; $value <= 20; $value++ ){
      $sqlParts[] = "($value)";
    }

    Abyss::DbQuery($sql . implode(', ', $sqlParts));
  }

  public static function typedLeviathans(array $dbResults) {
    return array_values(array_map(fn($dbResult) => new Leviathan($dbResult, self::$game->LEVIATHANS), $dbResults));
  }

  public static function draw(int $slot) {
    $leviathan = new Leviathan(self::$game->getObject("SELECT * FROM leviathan WHERE place = 0 ORDER BY RAND() LIMIT 1"), self::$game->LEVIATHANS);
    Abyss::DbQuery("UPDATE leviathan SET place = $slot WHERE id = " . $leviathan->id);
    $leviathan->place = $slot;
    return $leviathan;
  }

  public static function getVisibleLeviathans() {
    return self::typedLeviathans(self::$game->getCollection( "SELECT * FROM leviathan WHERE place > 0 and place < 99"));
  }

  public static function getLeviathanAtSlot(int $slot) {
    $dbLeviathan = self::$game->getObject("SELECT * FROM leviathan WHERE place = $slot");
    return $dbLeviathan !== null ? new Leviathan($dbLeviathan, self::$game->LEVIATHANS) : null;
  }

  

  public static function discard(int $id, int $playerId) {
    Abyss::DbQuery("UPDATE leviathan SET place = -$playerId WHERE id = $id");
  }

  public static function canFightWith(Leviathan $leviathan, array $hand, int $playerId): array {
    $possibleFactions = [FACTION_RED, 10];
    if ($leviathan->faction !== null) {
      $possibleFactions[] = $leviathan->faction;
    }
    if (Lord::playerHas(205, $playerId)) {
      $possibleFactions = [FACTION_PURPLE, FACTION_RED, FACTION_YELLOW, FACTION_GREEN , FACTION_BLUE, 10];
    }

    return array_values(array_filter($hand, fn($ally) => in_array($ally['faction'], $possibleFactions)));
  }

  public static function canFightSome(array $hand, int $playerId): array {
    $leviathans = self::getVisibleLeviathans();
    return array_values(array_filter($leviathans, fn($leviathan) => count(self::canFightWith($leviathan, $hand, $playerId)) > 0));
  }

  public static function getDefeatedLeviathans(int $playerId): int {
    return (int)self::$game->getValue("SELECT count(*) FROM leviathan WHERE place = -$playerId");
  }

  public static function getFightedLeviathan(): ?Leviathan {
    $id = self::$game->getGlobalVariable(FIGHTED_LEVIATHAN);
    $dbLeviathan = self::$game->getObject("SELECT * FROM leviathan WHERE id = $id");
    return $dbLeviathan !== null ? new Leviathan($dbLeviathan, self::$game->LEVIATHANS) : null;
  }

  public static function initiateLeviathanFight(int $playerId, $ally): int { // returns attack power
    $allyPower = $ally['value'];

    $dice = self::$game->getDoubleDieRoll();
    $bothDieEffect = $ally['effect'] === 2;
    $dicePower = $bothDieEffect ? max($dice) : $dice[0];
    
    $attackPower = $allyPower + $dicePower;
    $message = $bothDieEffect ? 
        clienttranslate('Ally power is ${allyPower} and dice rolled to ${die1} and ${die2} (max is kept : ${dicePower}), resulting in an attack power of ${attackPower}') :
        clienttranslate('Ally power is ${allyPower} and dice rolled to ${die1}, resulting in an attack power of ${attackPower}');

    self::$game->notifyAllPlayers("log", $message, [
        'allyPower' => $allyPower,
        'die1' => $dice[0],
        'die2' => $dice[1],
        'dicePower' => $dicePower,
        'attackPower' => $attackPower,
    ]);

    return $attackPower;
  }

  public static function moveLeviathanLife(int $playerId, Leviathan &$leviathan): int { // return number of rewards
    $rewards = 0;
    
    $combatCondition = $leviathan->combatConditions[$leviathan->life];
    $rewards += $combatCondition->reward;
    $leviathan->life++;
    Abyss::DbQuery("UPDATE leviathan SET life = $leviathan->life WHERE id = $leviathan->id");

    self::$game->notifyAllPlayers("moveLeviathanLife", clienttranslate('${player_name} beats the resistance ${resistance} of the Leviathan'), [
      'playerId' => $playerId,
      'player_name' => self::$game->getActivePlayerName(),
      'leviathan' => $leviathan,
      'resistance' => $combatCondition->resistance,
    ]);

    // If you have the Taxidermist, you gain extra Pearls
    if (Lord::playerHas(203, $playerId)) {
        $factions = array();
        self::$game->incPlayerPearls( $playerId, 2, "lord_203");
    }

    // If you have the Altruist, you gain extra reward
    if (Lord::playerHas(207, $playerId)) {
      $rewards++;
    }

    return $rewards;
  }

  public static function checkLeviathanDefeated(int $playerId, Leviathan &$leviathan): void {
    if ($leviathan->life >= count($leviathan->combatConditions)) { // leviathan is beaten
      self::discard($leviathan->id, $playerId);
      self::$game->setGlobalVariable(SLAYED_LEVIATHANS, self::$game->getGlobalVariable(SLAYED_LEVIATHANS) + 1);
      self::$game->setGlobalVariable(FIGHTED_LEVIATHAN, null);

      self::$game->notifyAllPlayers("leviathanDefeated", clienttranslate('${player_name} has defeated the Leviathan'), [
        'playerId' => $playerId,
        'player_name' => self::$game->getActivePlayerName(),
        'leviathan' => $leviathan,
        'defeatedLeviathans' => LeviathanManager::getDefeatedLeviathans($playerId),
      ]);

      self::$game->checkNewScourgeOwner($playerId);

      if (count(LeviathanManager::getVisibleLeviathans()) === 0) { // put a new one if it was the last one
        $dice = self::$game->getDoubleDieRoll();
        $sum = $dice[0] + $dice[1];
        $newLeviathan = LeviathanManager::draw(LEVIATHAN_SLOTS[$sum]);

        self::$game->notifyAllPlayers("newLeviathan", clienttranslate('Dice rolled to ${die1} and ${die2}, a new Leviathan takes place on the spot ${spot}'), [
            'die1' => $dice[0],
            'die2' => $dice[1],
            'spot' => $sum,
            'leviathan' => $newLeviathan,
            'discardedLeviathan' => null,
        ]);
      }
    }
  }

  public static function fightLeviathan(int $playerId, Leviathan &$leviathan, int $attackPower): int { // return number of rewards
    $rewards = 0;
    while ($attackPower > 0 && $leviathan->life < count($leviathan->combatConditions)) {
      $combatCondition = $leviathan->combatConditions[$leviathan->life];
      $attackPower -= $combatCondition->resistance;
      if ($attackPower >= 0) {
        $rewards += self::moveLeviathanLife($playerId, $leviathan);
      }
    }

    self::checkLeviathanDefeated($playerId, $leviathan);  

    return $rewards;
  }
}
