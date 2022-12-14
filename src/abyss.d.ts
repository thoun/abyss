/**
 * Your game interfaces
 */

interface AbyssPlayer extends Player {
    // TODO
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
    game_ending_player;
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