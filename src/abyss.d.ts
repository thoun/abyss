/**
 * Your game interfaces
 */

interface AbyssAlly {
    ally_id: number;
    faction: number | null;
    value: number;
    just_spent: boolean;
    affiliated: boolean;
    place: number;
    effect: number | null;
}

interface AbyssLord {
    lord_id: number;
    points: number;
    keys: number;
    cost: number;
    diversity: number;
    used: boolean;
    turned: boolean;
    faction: number;
    place: number;
    location?: number;
    name;
    desc;
    effect;
}

interface AbyssLocation {
    location_id: number;
    name: number;
    desc: string;
    loots: AbyssLoot[];
}

interface AbyssMonster {
    monster_id: number;
    value: number;
    place: number;
    type: 0 | 1;
    effect?: number | null;
}

interface AbyssLoot {
    id: number;
    value: number;
}

interface LeviathanCombatCondition {
    resistance: number;
    reward: number;
}

interface AbyssLeviathan {
    id: number;
    place: number;
    life: number;
    combatConditions: LeviathanCombatCondition[];
    faction: number | null;
    penalty: number;
    penaltyCount: number;
}

interface AbyssPlayer extends Player {
    hand: AbyssAlly[];
    affiliated: AbyssAlly[];
    locations: AbyssLocation[];
    lords: AbyssLord[];
    monsters?: AbyssMonster[];
    pearls: number;
    nebulis?: number;
    keys: string;
    autopass: string;
    hand_size: number;
    num_monsters: number;
    wounds?: number;
    defeatedLeviathans?: number;
}

interface Sentinel {
    lordId: number;
    playerId: number | null;
    location: string | null;
    locationArg: number | null;
}

interface AbyssGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: AbyssPlayer };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    turn_order: { [playerId: number]: number };
    game_ending_player: number;
    lord_slots: AbyssLord[];
    ally_explore_slots: AbyssAlly[];
    ally_council_slots: number[];
    lord_deck: number;
    ally_deck: number;
    threat_level: number;
    location_available: AbyssLocation[];
    location_deck: number;
    allyDiscardSize: number;

    krakenExpansion: boolean;
    kraken?: number;
    sentinels?: Sentinel[];

    leviathanExpansion: boolean;
    scourge?: number;
    leviathans?: AbyssLeviathan[];
    lastDieRoll?: any[];
    fightedLeviathan?: AbyssLeviathan;
}

interface AbyssGame extends Game {
    animationManager: AnimationManager;
    allyManager: AllyManager;
    lordManager: LordManager;
    lootManager: LootManager;
    locationManager: LocationManager;
    leviathanManager: LeviathanManager;
    keyTokenCounts: number[];
    keyFreeLordsCounts: number[];

    setTooltip(id: string | HTMLElement, html: string): void;
    setTooltipToClass(className: string, html: string): void;
    getPlayerId(): number;
    getOpponentsIds(playerId: number): number[];
    getPlayerTable(playerId: number): PlayerTable;
    getCurrentPlayerTable(): PlayerTable;
    organisePanelMessages(): void;
    discardAllies(ids: number[]): void;
    onClickPlayerHand(ally: AbyssAlly): void;
    onClickPlayerFreeLord(lord: AbyssLord): void;
    onClickPlayerLockedLord(lord: AbyssLord): void;
    onClickPlayerLocation(location: AbyssLocation): void;
    onLeviathanClick(card: AbyssLeviathan): void;
    onLeviathanTrackSlotClick(slot: number): void;
    updateKeyCounter(playerId: number): void;
}

type WithNebulis = { [nebulis: number]: boolean };

interface EnteringRecruitPayArgs {
    lord_id: number;
    lord: AbyssLord;
    cost: number;
    pearls: number;
    nebulis?: number;
	withNebulis?: WithNebulis;
    canAlwaysUseNebulis: boolean;
}

interface EnteringControlPostDrawArgs {
    location_ids: number[];
    default_lord_ids: number[];
}

interface EnteringLocationEffectBlackSmokersArgs {
    _private?: {
        locations: AbyssLocation[];
    };
}

interface EnteringExplorePurchaseArgs {
    passed_players: number[];
    first_player: number;
}

interface EnteringPurchaseArgs extends EnteringExplorePurchaseArgs {
    cost: number;
    canPayWithPearls: boolean;
    withNebulis?: WithNebulis;
}

interface EnteringExploreArgs extends EnteringExplorePurchaseArgs {
    ally: AbyssAlly;
    monster: boolean;
    canIgnore: boolean;
}

interface EnteringMartialLawArgs {
    canPay: boolean;
    diff: number;
}

interface EnteringGiveKrakenArgs {
    playersIds: number[];
}

interface EnteringIncreaseAttackPowerArgs {
    attackPower: number;
    payPearlEffect: boolean;
    playerPearls: number;
}

interface EnteringChooseFightRewardArgs {
    rewards: number;
}

interface EnteringLord104Args {
    nebulis: number;
    playersIds: number[];
}

interface EnteringLord112Args {
    allies: AbyssAlly[];
}

interface EnteringLord116Args {
    lords: AbyssLord[];
}

interface EnteringFillSanctuaryArgs {
    locationId: number;
}

interface EnteringPlaceSentinelArgs {
    possibleOnLords: boolean;
    possibleOnCouncil: boolean;
    possibleOnLocations: boolean;
}

interface EnteringChooseLeviathanToFightArgs {
    selectableLeviathans: AbyssLeviathan[];
}

interface EnteringChooseAllyToFightArgs {
    selectableAllies: AbyssAlly[];
}

interface NotifFinalRoundArgs {
    player_id: number;
}

interface NotifEndGameScoringArgs {
    breakdowns: any[];
    winner_ids: number[];
}

interface NotifUseLordArgs {
    lord_id: number;
}

interface NotifScoreArgs {
    score: number;
    player_id: number;
}

interface NotifControlArgs {
    location: AbyssLocation;
    lords: AbyssLord[];
    player_id: number;
}

interface NotifLoseLocationArgs {
    location_id: number;
    player_id: number;
}

interface NotifNewLocationsArgs {
    locations: AbyssLocation[];
    deck_size: number;
}

interface NotifDisableArgs {
    lord_id: number;
}

interface NotifAllyDeckShuffleArgs {
    deck_size: number;
}

interface NotifMonsterRewardArgs {
    player_id: number;
    playerPearls: number;
    monsters: number;
    keys: number;
}

interface NotifMonsterTokensArgs {
    monsters: AbyssMonster[];
}

interface NotifRemoveMonsterTokenArgs {
    playerId: number;
    monster: AbyssMonster;
}

interface NotifMonsterHandArgs {
    monsters: AbyssMonster[];
    player_id: number;
}

interface NotifPlotArgs {
    lord: AbyssLord;
    player_id: number;
    deck_size: number;
    playerPearls: number;
    old_lord: AbyssLord;
}

interface NotifAffiliateArgs {
    ally: AbyssAlly;
    player_id: number;
    also_discard: boolean;
}

interface NotifExploreArgs {
    ally: AbyssAlly;
    deck_size: number;
}

interface NotifExploreTakeArgs {
    player_id: number;
    slot: number;
    ally: AbyssAlly;
    allyDiscardSize: number;
}

interface NotifPurchaseArgs {
    player_id: number;
    slot;
    playerPearls: number;
    playerNebulis: number;
    firstPlayerPearls: number;
    firstPlayerNebulis: number;
    first_player_id: number;
    ally: AbyssAlly;
    discardSize?: number;
}

interface NotifThreatArgs {
    threat: number;
}

interface NotifDiscardCouncilArgs {
    player_id: number;
    faction: number;
    num: number;
    allyDiscardSize: number;
}

interface NotifRequestSupportArgs {
    player_id: number;
    faction: number;
    num: number;
}

interface NotifRequestSupportCardsArgs {
    player_id: number;
    faction: number;
    allies: AbyssAlly[];
}

interface NotifRecruitArgs {
    lord?: AbyssLord;
    player_id: number;
    playerPearls: number;
    playerNebulis: number;
    spent_lords: AbyssLord[];
    spent_allies: AbyssAlly[];
    allyDiscardSize: number;
    freeLord?: boolean;
}

interface NotifRefillLordsArgs {
    lords: AbyssLord[];
    player_id: number;
    deck_size: number;
}

interface NotifDiffArgs {
    player_id: number;
    source?: string;
    playerPearls?: number;
    playerNebulis?: number;
    wounds?: number;
    keys?: number;
    allies_lost?: AbyssAlly[];
    monster?: AbyssMonster[];
    monster_count?: number;
    allyDiscardSize: number;
}

interface NotifPayMartialLawArgs {
    playerId: number;
    playerPearls: number;
}

interface NotifNewLootArgs {
    playerId: number;
    locationId: number;
    newLoot: AbyssLoot;
}

interface NotifDiscardLootsArgs {
    playerId: number;
    locationId: number;
    loots: AbyssLoot[];
}

interface NotifSearchSanctuaryAllyArgs {
    playerId: number;
    ally: AbyssAlly;
    deck_size: number;
    allyDiscardSize: number;
}

interface NotifPlaceSentinelArgs {
    playerId: number;
    lordId: number;
    location: string;
    locationArg: number;
}

interface NotifPlaceKrakenArgs {
    playerId: number;
    ally: AbyssAlly;
    faction: number;
    deckSize: number;
}

interface NotifLeviathanArgs {
    leviathan: AbyssLeviathan;
}

interface NotifLeviathanDefeatedArgs extends NotifLeviathanArgs {
    playerId: number;
    defeatedLeviathans: number;
}

interface NotifDiscardExploreMonsterArgs {
    ally: AbyssAlly;
    allyDiscardSize: number;
}

interface NotifDiscardAllyTofightArgs {
    playerId: number;
    ally: AbyssAlly;
    allyDiscardSize: number;
}