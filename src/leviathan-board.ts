class LeviathanBoard {
    public playerId: number;

    private stock: SlotStock<AbyssLeviathan>;

    constructor(private game: AbyssGame, gamedatas: AbyssGamedatas) {        
        this.stock = new SlotStock<AbyssLeviathan>(this.game.leviathanManager, document.getElementById('leviathan-board'), {
            slotsIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            mapCardToSlot: card => card.place,
        });
        this.stock.addCards(gamedatas.leviathans);
        this.stock.onCardClick = card => this.game.onLeviathanClick(card);
    }
    
    public async newLeviathan(leviathan: AbyssLeviathan, discardedLeviathan: AbyssLeviathan | null) {
        if (discardedLeviathan) {
            await this.stock.removeCard(discardedLeviathan);
        }
        await this.stock.addCard(leviathan);
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
}