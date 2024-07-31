const SLOTS_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 99];

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

class LeviathanBoard {
    public playerId: number;

    private stock: SlotStock<AbyssLeviathan>;
    private diceManager: AbyssDiceManager;
    private diceStock: LineDiceStock;
    private currentAttackPowerDiceStock: LineDiceStock;

    constructor(private game: AbyssGame, gamedatas: AbyssGamedatas) {    
        this.diceManager = new AbyssDiceManager(game);
        this.diceStock = new LineDiceStock(this.diceManager, document.getElementById(`leviathan-dice-stock`), { gap: '2px' });
        document.getElementById(`leviathan-dice-stock`).dataset.place = `${gamedatas.lastDieRoll[0]}`;
        const diceValues = gamedatas.lastDieRoll[1];
        const dice = diceValues.map((face, id) => ({ id, face, type: 0 }));
        this.diceStock.addDice(dice);

        this.stock = new SlotStock<AbyssLeviathan>(this.game.leviathanManager, document.getElementById('leviathan-board'), {
            slotsIds: SLOTS_IDS, // 99 = temp space
            mapCardToSlot: card => card.place,
        });
        this.stock.addCards(gamedatas.leviathans);
        this.stock.onCardClick = card => this.game.onLeviathanClick(card);

        SLOTS_IDS.forEach((slot: number) => {
            const slotDiv = document.querySelector(`#leviathan-board [data-slot-id="${slot}"]`) as HTMLDivElement;
            slotDiv.addEventListener('click', () => {
                if (slotDiv.classList.contains('selectable')) {
                    this.game.onLeviathanTrackSlotClick(slot);
                }
            });
        });

        if (gamedatas.fightedLeviathan) {
            this.game.leviathanManager.getCardElement(gamedatas.fightedLeviathan).classList.add('fighted-leviathan');
        }
        if (gamedatas.currentAttackPower) {
            this.setCurrentAttackPower(gamedatas.currentAttackPower);
        }
    }
    
    public async discardLeviathan(leviathan: AbyssLeviathan) {
        await this.stock.removeCard(leviathan);
    }
    
    public async newLeviathan(leviathan: AbyssLeviathan) {
        await this.stock.addCard(leviathan, { fromElement: document.getElementById('leviathan-track') });
    }
    
    public async showDice(spot: number, diceValues: number[]) {
        document.getElementById(`leviathan-dice-stock`).dataset.place = `${spot}`;
        const dice = diceValues.map((face, id) => ({ id, face, type: 0 }));
        await this.diceStock.addDice(dice);
        //await sleep(500);

        this.diceStock.rollDice(dice, {
            effect: 'rollIn',
            duration: [800, 1200]
        });
        await sleep(1200);
    }
    
    public async moveLeviathanLife(leviathan: AbyssLeviathan) {
        this.game.leviathanManager.setLife(leviathan);
    }

    public async leviathanDefeated(leviathan: AbyssLeviathan) {
        await this.stock.removeCard(leviathan);
    }
    
    public setSelectableLeviathans(selectableLeviathans: AbyssLeviathan[] | null) {
        this.stock.setSelectionMode(selectableLeviathans ? 'single' : 'none', selectableLeviathans);
    }
    
    public setAllSelectableLeviathans() {
        this.stock.setSelectionMode('single');
    }
    
    public async setCurrentAttackPower(args: NotifSetCurrentAttackPowerArgs) {
        let div = document.getElementById('current-attack-power');
        const animateDice = !div;
        const dice = args.dice.map((face, id) => ({ id: -1000 + id, face, type: 0 }));

        if (!div) {
            div = document.createElement('div');
            div.id = 'current-attack-power';
            this.game.leviathanManager.getCardElement(args.fightedLeviathan).querySelector('.front').appendChild(div);
            div.innerHTML = `
            <div>${_('Attack:')}</div>
            <div><span style="color: transparent;">+</span> ${args.allyPower} (<i class="icon icon-ally"></i>)</div>
            <div>+ <span id="current-attack-power-dice-power">${animateDice ? '?' : args.dicePower}</span> (<div id="current-attack-power-dice"></div>)</div>
            <div id="current-attack-power-pearls"></div>
            <div id="current-attack-power-total">= ${animateDice ? '?' : args.attackPower}</div>`;

            this.diceStock = new LineDiceStock(this.diceManager, document.getElementById(`current-attack-power-dice`), { gap: '2px' });
            this.diceStock.addDice(dice);
        }

        if (animateDice) {
            this.diceStock.rollDice(dice, {
                effect: 'rollIn',
                duration: [800, 1200]
            });
            await sleep(1200);
            document.getElementById('current-attack-power-dice-power').innerText = `${args.dicePower}`;
            document.getElementById('current-attack-power-total').innerHTML = `= ${args.attackPower}`;
        }

        if (dice.length > 1) {
            const grayedDiceIndex = args.dice[1] > args.dice[0] ? 0 : 1;
            Array.from(document.getElementById(`current-attack-power-dice`).querySelectorAll('.bga-dice_die'))[grayedDiceIndex].classList.add('grayed');
        }

        if (args.attackPower > (args.allyPower + args.dicePower)) {
            document.getElementById('current-attack-power-pearls').innerHTML = `+ ${args.attackPower - (args.allyPower + args.dicePower)} (<i class="icon icon-pearl"></i>)</div>`;
            document.getElementById('current-attack-power-total').innerHTML = `= ${args.attackPower}`;
        }
    }
    
    public removeCurrentAttackPower() {
        document.getElementById('current-attack-power')?.remove();
        this.currentAttackPowerDiceStock = null;
    }
}