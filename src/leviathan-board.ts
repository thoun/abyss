class LeviathanBoard {
    public playerId: number;

    private stock: SlotStock<AbyssLeviathan>;

    constructor(private game: AbyssGame, gamedatas: AbyssGamedatas) {        
        this.stock = new SlotStock<AbyssLeviathan>(this.game.leviathanManager, document.getElementById('leviathan-board'), {
            slotsIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            mapCardToSlot: card => card.place,
        });
        this.stock.addCards(gamedatas.leviathans);
    }
}