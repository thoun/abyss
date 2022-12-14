/**
 * Your game interfaces
 */

interface AbyssPlayer extends Player {
    hand: any[];
    affiliated;
    locations;
    lords;
    monsters;
    autopass;
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
    // TODO
}

interface EnteringChooseCellArgs {
    // TODO
}

interface NotifDiceRollArgs {
    // TODO
}