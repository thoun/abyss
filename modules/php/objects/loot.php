<?php


class Loot {
    public int $id;
    public int $value;
    public /*int|null*/ $locationId;

    public function __construct($dbCard) {
        $this->id = intval($dbCard['id']);
        $this->value = intval($dbCard['value']);
        $this->locationId = $dbCard['location_id'] != null ? intval($dbCard['location_id']) : null;
    }
}

?>