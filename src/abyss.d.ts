/**
 * Your game interfaces
 */

interface AbyssAlly {
    ally_id;
    faction;
    value;
    place;
}

interface AbyssLord {
    lord_id;
    turned;
    cost;
    diversity;
    used;
    effect;
    keys;
    name;
    desc;
    faction;
    place;
    points;
}

interface AbyssLocation {
    desc;
    location_id;
    name;
}

interface AbyssPlayer extends Player {
    hand: any[];
    affiliated;
    locations;
    lords;
    monsters;
    pearls;
    keys;
    autopass;
    hand_size;
    num_monsters;
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
    turn_order;
    game_ending_player;
    lord_slots;
    ally_explore_slots;
    ally_council_slots;
    lord_deck;
    ally_deck;
    threat_level;
    location_available;
    location_deck;
}

interface AbyssGame extends Game {
    allyManager: AllyManager;
    lordManager: LordManager;
    locationManager: LocationManager;

    connectTooltip(node: any, html: string | Function, offsetType: string): void;
}

interface EnteringRecruitPayArgs {
    lord_id: number;
    cost: number;
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

interface EnteringPurchaseArgs {
    passed_players: number[];
    first_player: number;
    cost: number;
}

interface NotifEndGameScoringArgs {
    breakdowns;
    winner_ids;
}

interface NotifUseLordArgs {
    lord_id;
}

interface NotifScoreArgs {
    score;
    player_id;
}

interface NotifControlArgs {
    location;
    lords;
    player_id;
}

interface NotifLoseLocationArgs {
    location_id;
    player_id;
}

interface NotifNewLocationsArgs {
    locations;
    deck_size;
}

interface NotifDisableArgs {
    lord_id;
}

interface NotifAllyDeckShuffleArgs {
    deck_size;
}

interface NotifMonsterRewardArgs {
    player_id;
    pearls;
    monsters;
    keys;
}

interface NotifMonsterRewardArgs {
    monsters;
}

interface NotifMonsterTokensArgs {
    monsters;
    player_id;
}

interface NotifMonsterHandArgs {
    monsters;
    player_id;
}

interface NotifPlotArgs {
    lord;
    player_id;
    deck_size;
    pearls;
    old_lord;
}

interface NotifAffiliateArgs {
    ally;
    player_id;
    also_discard;
}

interface NotifExploreArgs {
    ally;
    deck_size;
}

interface NotifExploreTakeArgs {
    player_id;
    slot;
    ally;
}

interface NotifPurchaseArgs {
    player_id;
    slot;
    cost;
    first_player_id;
    ally;
}

interface NotifExploreTakeArgs {
    threat;
}

interface NotifThreatArgs {
    threat;
}

interface NotifDiscardCouncilArgs {
    player_id;
    faction;
    num;
}

interface NotifRequestSupportArgs {
    player_id;
    faction;
    num;
}

interface NotifRequestSupportCardsArgs {
    player_id;
    faction;
    allies;
}

interface NotifRecruitArgs {
    lord;
    player_id;
    spent_pearls;
    spent_lords;
    spent_allies;
}

interface NotifRefillLordsArgs {
    lords;
    player_id;
    deck_size;
}

interface NotifDiffArgs {
    player_id;
    source;
    pearls;
    keys;
    allies_lost;
    monster;
    monster_count;
}
