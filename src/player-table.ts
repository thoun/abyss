class PlayerTable {
    static sortAllies = sortFunction('faction', 'value');

    public playerId: number;

    private hand: LineStock<AbyssAlly>;
    private affiliatedStocks: LineStock<AbyssAlly>[] = [];
    private freeLords: LineStock<AbyssLord>;
    private locations: LineStock<AbyssLocation>;
    private currentPlayer: boolean;

    constructor(private game: AbyssGame, player: AbyssPlayer) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let template = `
        <div id="player-panel-${player.id}" class="player-panel whiteblock">
            <h3 class="player-name" style="color: #${player.color};" data-color="${player.color}">${player.name}</h3>
            ${this.currentPlayer ? `<div id="player-hand" class="hand"><i id="no-hand-msg">${_("No Allies in hand")}</i></div>` : ''}
            <h4>${_("Affiliated Allies")}</h4>
            <i id="no-affiliated-msg-p${player.id}">${_("No Affiliated Allies")}</i>
            <div id="player-panel-${player.id}-affiliated" class="affiliated"></div>
            <h4>${_("Lords")}</h4>
            <i id="no-lords-msg-p${player.id}">${_("No Lords")}</i>
            <div id="player-panel-${player.id}-free-lords" class="free-lords"></div>
            <div id="player-panel-${player.id}-locations" class="locations"></div>
            <div id="player-panel-${player.id}-sentinels" class="sentinels"></div>
        </div>
        `;
        
        dojo.place(template, $('player-panel-holder'));
        
        // Add a whiteblock for the player
        if (this.currentPlayer) {
            this.hand = new LineStock<AbyssAlly>(this.game.allyManager, document.getElementById('player-hand'), {
                center: false,
                sort: PlayerTable.sortAllies,
            });
            this.hand.onCardClick = card => this.game.onClickPlayerHand(card);
            this.hand.addCards(player.hand);
        }
        
        // Add player affiliated
        this.placeAffiliated(player.affiliated, this.playerId);
        
        // Add free lords
        this.freeLords = new LineStock<AbyssLord>(this.game.lordManager, document.getElementById(`player-panel-${player.id}-free-lords`), {
            center: false,
        });
        this.freeLords.onCardClick = card => this.game.onClickPlayerFreeLord(card);
        this.freeLords.addCards(player.lords.filter(lord => lord.location == null));
        
        // Add locations
        this.locations = new LineStock<AbyssLocation>(this.game.locationManager, document.getElementById(`player-panel-${player.id}-locations`), {
            center: false,
        });
        this.locations.onCardClick = card => this.game.onClickPlayerLocation(card);
        player.locations.forEach(location => this.addLocation(location, player.lords.filter(lord => lord.location == location.location_id)));

        this.game.lordManager.updateLordKeys(this.playerId);
        $('lordcount_p' + this.playerId).innerHTML = ''+player.lords.length;
    }
    
    public addHandAlly(ally: AbyssAlly, fromElement?: HTMLElement, originalSide?, rotationDelta?: number) {
        this.hand.addCard(ally, {
            fromElement,
            originalSide,
            rotationDelta,
        });

        this.game.organisePanelMessages();
    }
    
    public removeHandAllies(allies: AbyssAlly[]) {
        allies.forEach(ally => this.game.allyManager.removeCard(ally));
    }
    
    public organisePanelMessages() {
        const i = this.playerId;
        // Do they have any Lords?
        const lords = dojo.query('.lord', $('player-panel-' + i));
        $('no-lords-msg-p' + i).style.display = lords.length > 0 ? 'none' : 'block';
        
        // Affiliated?
        const affiliated = this.getAffiliatedAllies();
        $('no-affiliated-msg-p' + i).style.display = affiliated.length > 0 ? 'none' : 'block';
        
        if (this.currentPlayer) {
            // Hand?
            const hand = this.hand.getCards();
            $('no-hand-msg').style.display = hand.length > 0 ? 'none' : 'block';
        }
    }

    private placeAffiliated(allies: AbyssAlly[], playerId: number) {
      let parent = document.getElementById(`player-panel-${playerId}-affiliated`);
      for (var faction=0; faction < 5; faction++) {
        let factionHolder = dojo.create("div");
        factionHolder.className = "affiliated-faction";
        factionHolder.setAttribute("data-faction", faction);
        dojo.place(factionHolder, parent);

        this.affiliatedStocks[faction] = new LineStock<AbyssAlly>(this.game.allyManager, factionHolder, {
            center: false,
            sort: PlayerTable.sortAllies,
        });
        this.affiliatedStocks[faction].addCards(allies.filter(ally => ally.faction == faction));
        this.affiliatedStocks[faction].onCardClick = ally => this.affiliatedAllyClick(ally);
      }
      return parent;
    }

    public addAffiliated(ally: AbyssAlly) {
        this.affiliatedStocks[ally.faction].addCard(ally);
    }
    
    public addLord(lord: AbyssLord) {
        $('lordcount_p' + this.playerId).innerHTML = Number($('lordcount_p' + this.playerId).innerHTML) + 1;
        this.freeLords.addCard(lord);
    }
    
    public removeLords(lords: AbyssLord[]) {
        $('lordcount_p' + this.playerId).innerHTML = Number($('lordcount_p' + this.playerId).innerHTML) - lords.length;
        this.freeLords.removeCards(lords);
    }

    private getAffiliatedAllies() {
        let affiliated = [];

        for (var faction=0; faction < 5; faction++) {
            affiliated.push(...this.affiliatedStocks[faction].getCards());
        }

        return affiliated;
    }
    
    public addLocation(location: AbyssLocation, lords: AbyssLord[]) {
        this.locations.addCard(location);
        this.game.locationManager.addLords(location.location_id, lords);
    }
    
    private affiliatedAllyClick(ally: AbyssAlly): void {
        if ((this.game as any).gamedatas.gamestate.name === 'lord114multi') {
            this.game.discardAllies([ally.ally_id]);
        }
    }

    public getFreeLords(includeDisabled = false): AbyssLord[] {
        let lords = this.freeLords.getCards();

        if (!includeDisabled) {
            lords = lords.filter(lord => !this.freeLords.getCardElement(lord).classList.contains('disabled'));
        }

        return lords;
    }

    public hasLord(lordId: number, includeDisabled = false): boolean {
        return this.getFreeLords(includeDisabled).some(lord => lord.lord_id == lordId);
    }
    
    public removeLocation(location: AbyssLocation) {
        this.locations.removeCard(location);
        this.game.locationManager.removeLordsOnLocation(location);
    }
}