
interface Die {
    id: number;
    value: number;
}

class LeviathanDie extends BgaDie6 {
    size?: number;
    
    constructor() {
        super();
        this.size = 24;
    }
}

class AbyssDiceManager extends DiceManager {
 
    constructor(game: AbyssGame) {
        super(game, {
            dieTypes: {
                '0': new LeviathanDie(),
            },
            perspective: 10000,
        });
    }  
}
