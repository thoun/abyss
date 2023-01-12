<?php


class Sentinel {
    public int $lordId;
    public /*int|null*/ $playerId = null;
    public /*string|null*/ $location = null;
    public /*int|null*/ $locationArg = null;

    public function __construct(int $lordId) {
        $this->lordId = $lordId;
    }
}

?>