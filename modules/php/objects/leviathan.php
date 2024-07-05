<?php

const FACTION_PURPLE = 0;
const FACTION_RED = 1;
const FACTION_YELLOW = 2;
const FACTION_GREEN = 3;
const FACTION_BLUE = 4;

const PENALTY_WOUNDS = 1;
const PENALTY_PEARLS = 2;
const PENALTY_ALLIES = 3;
const PENALTY_LORD = 4;

class CombatCondition {
    public int $resistance;
    public int $reward;

    public function __construct(int $resistance, int $reward) {
        $this->resistance = $resistance;
        $this->reward = $reward;
    }
}

class LeviathanType {
    public ?int $faction = null;
    public array $combatConditions;
    public int $penalty;
    public int $penaltyCount = 3;

    public function __construct(?int $faction, array $combatConditions, int $penalty, int $penaltyCount = 3) {
        $this->faction = $faction;
        $this->combatConditions = $combatConditions;
        $this->penalty = $penalty;
        $this->penaltyCount = $penaltyCount;
    }
}

class Leviathan extends LeviathanType {
    public int $id;
    public int $place;
    public int $life;

    public function __construct($dbCard, $LEVIATHANS) {
        $this->id = intval($dbCard['id']);
        $this->place = intval($dbCard['place']);
        $this->life = intval($dbCard['life']);
        $type = $LEVIATHANS[$this->id];
        $this->faction = $type->faction;
        $this->combatConditions = $type->combatConditions;
        $this->penalty = $type->penalty;
    }
}

?>