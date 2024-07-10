const SLOTS_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 99];

class LeviathanBoard {
    public playerId: number;

    private stock: SlotStock<AbyssLeviathan>;

    constructor(private game: AbyssGame, gamedatas: AbyssGamedatas) {        
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
    }
    
    public async newLeviathan(leviathan: AbyssLeviathan, discardedLeviathan: AbyssLeviathan | null) {
        if (discardedLeviathan) {
            await this.stock.removeCard(discardedLeviathan);
        }
        await this.stock.addCard(leviathan, { fromElement: document.getElementById('leviathan-track') });
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