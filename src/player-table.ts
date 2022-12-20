class PlayerTable {
    public playerId: number;

    private hand: LineStock<AbyssAlly>;
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
            <div class="free-lords"></div>
            <div class="locations"></div>
        </div>
        `;
        
        dojo.place(template, $('player-panel-holder'));
        
        // Add a whiteblock for the player
        if (this.currentPlayer) {
            this.hand = new LineStock<AbyssAlly>(this.game.allyManager, document.getElementById('player-hand'), {
                center: false,
                sort: sortFunction('faction', 'value'),
            });
            this.hand.addCards(player.hand);
        }
        
        // Add player affiliated
        this.game.allyManager.placeAffiliated(player.affiliated, this.playerId);
        
        // Add locations
        var locationsHolder = dojo.query(`#player-panel-${player.id} .locations`)[0];
        for (var j in player.locations) {
            var location = player.locations[j];
            var lords = [];
            for (var k in player.lords) {
                var lord = player.lords[k];
                if (+lord.location == +location.location_id) {
                    lords.push(lord);
                }
            }
            let locationNode = this.game.locationManager.placeWithTooltip( location, locationsHolder );
            this.game.locationManager.placeLords(locationNode, lords);
        }
        
        var freeLordHolder = dojo.query(`#player-panel-${player.id} .free-lords`)[0];
        for (var j in player.lords) {
            var lord = player.lords[j];
            if (lord.location == null) {
                this.game.lordManager.placeWithTooltip(lord, freeLordHolder);
            }
        }

        this.game.lordManager.updateLordKeys(this.playerId);
        this.game.locationManager.organisePlayerBoard(this.playerId);
    }
    
    public addHandAlly(ally: AbyssAlly, fromElement?: HTMLElement) {
        this.hand.addCard(ally, {
            fromElement,
        });

        this.game.organisePanelMessages();
    }
    
    public removeHandAllies(allies: AbyssAlly[]) {
        allies.forEach(ally => this.hand.removeCard(ally));
    }
    
    public organisePanelMessages() {
        const i = this.playerId;
        // Do they have any Lords?
        const lords = dojo.query('.lord', $('player-panel-' + i));
        $('no-lords-msg-p' + i).style.display = lords.length > 0 ? 'none' : 'block';
        
        // Affiliated?
        const affiliated = dojo.query('.affiliated .ally', $('player-panel-' + i));
        $('no-affiliated-msg-p' + i).style.display = affiliated.length > 0 ? 'none' : 'block';
        
        if (this.currentPlayer) {
            // Hand?
            const hand = dojo.query('.ally', $('player-hand'));
            $('no-hand-msg').style.display = hand.length > 0 ? 'none' : 'block';
        }
    }
}