const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
const log = isDebug ? console.log.bind(window.console) : function () { };

declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

let debounce;

class Abyss implements AbyssGame {
    public allyManager: AllyManager;
    public lordManager: LordManager;
    public lootManager: LootManager;
    public locationManager: LocationManager;

    private gamedatas: AbyssGamedatas;
    private playersTables: PlayerTable[] = [];
    private useZoom: boolean;
    private zoomLevel: number;
    private lastExploreTime: number;
    private visibleAllies: SlotStock<AbyssAlly>;
    private councilStacks: VoidStock<AbyssAlly>[] = [];
    private visibleLords: SlotStock<AbyssLord>;
    private visibleLocations: LineStock<AbyssLocation>;
    private visibleLocationsOverflow: LineStock<AbyssLocation>;

    constructor() {
    }

    setup(gamedatas: AbyssGamedatas) {
        log( "Starting game setup" );
        
        if (!gamedatas.krakenExpansion) {
            (this as any).dontPreloadImage(`lords-kraken.jpg`);
        }
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.allyManager = new AllyManager(this);
        this.lordManager = new LordManager(this);
        this.lootManager = new LootManager(this);
        this.locationManager = new LocationManager(this, this.lordManager, this.lootManager);

        // Use zoom when not on FF
        this.useZoom = false; //navigator.userAgent.toLowerCase().indexOf('firefox') <= -1;
        
        let self = this as any;
        dojo.connect($('modified-layout-checkbox'), 'onchange', () => {
            if ($('modified-layout-checkbox').checked) {
                dojo.addClass($('game-board-holder'), "playmat");
            } else {
                dojo.removeClass($('game-board-holder'), "playmat");
            }
        });

        const usePlaymat = (this as any).prefs[100].value == 1 ;   
        // On resize, fit cards to screen (debounced)
        if (usePlaymat) {
            dojo.addClass($('game-board-holder'), "playmat");
        }
        dojo.connect(window, "onresize", debounce(() => {
            let r = $('game-holder').getBoundingClientRect();
            let w = r.width;
            let zoom = 1;
            if (usePlaymat) {
                if (w > 1000) {
                    zoom = w/1340;
                    dojo.addClass($('game-board-holder'), "playmat");
                    dojo.removeClass($('game-board-holder'), "playmat-narrow");
                } else {
                    dojo.removeClass($('game-board-holder'), "playmat");
                    dojo.addClass($('game-board-holder'), "playmat-narrow");
                }
            }
            self.zoomLevel = zoom;
            if (self.useZoom) {
                dojo.style($('game-board-holder'), {
                    zoom: zoom
                });
                dojo.style($('locations-holder-overflow'), {
                    zoom: zoom * 0.87
                });
            } else {
                let height = zoom == 1 ? "" : ((639 * zoom) + "px");
                dojo.style($('game-board-holder'), {
                    transform: "scale("+zoom+")",
                    height: height
                });
            }
            this.organiseLocations();
        }, 200));

        if (gamedatas.krakenExpansion) {
            document.getElementById('scoring-row-total').insertAdjacentHTML('beforebegin', `
                <tr id="scoring-row-nebulis">
                    <td class="first-column"><span class="arrow">→</span><i id="scoring-nebulis-icon" class="icon icon-nebulis"></i></td>
                </tr>
                <tr id="scoring-row-kraken">
                    <td class="first-column"><span class="arrow">→</span><i id="scoring-kraken-icon" class="icon-kraken"></i></td>
                </tr>
            `);
        }
        
        // Setting up player boards
        this.createPlayerPanels(gamedatas);
        
        // Add an extra column at the end, just for padding reasons
        $('scoring-row-players').innerHTML += `<td></td>`;
        
        $('scoring-row-location').innerHTML += `<td></td>`;
        $('scoring-row-lord').innerHTML += `<td></td>`;
        $('scoring-row-affiliated').innerHTML += `<td></td>`;
        $('scoring-row-monster').innerHTML += `<td></td>`;
        if (gamedatas.krakenExpansion) {
            $('scoring-row-nebulis').innerHTML += `<td></td>`;
            $('scoring-row-kraken').innerHTML += `<td></td>`;  
        }
        
        $('scoring-row-total').innerHTML += `<td></td>`;

        var p = (this as any).player_id;
        if ((this as any).isSpectator) {
            p = gamedatas.playerorder[0];
        }
        let players_done = {};
        do {
            if (players_done[p]) break;
            players_done[p] = 1;
            const player = gamedatas.players[p];

            const table = new PlayerTable(this, player);
            this.playersTables.push(table);

            p = gamedatas.turn_order[p];
        } while (p != (this as any).player_id);

        // Monsters
        for( var playerId in gamedatas.players ) {
            var monster_hand = $('monster-hand_p' + playerId);
            if (monster_hand) {
                var player = gamedatas.players[playerId];

                if (player.monsters && Object.keys(player.monsters).length > 0) {
                    dojo.style(monster_hand, "display", "block");
                    for (var i in player.monsters) {
                        dojo.place( '<i class="icon icon-monster-faceup icon-monster-'+ player.monsters[i].value +'">'+ player.monsters[i].value +'</i>', monster_hand );
                    }
                }
            }
        }

        // Lords
        this.visibleLords = new SlotStock<AbyssLord>(this.lordManager, document.getElementById('visible-lords-stock'), {
            slotsIds: [1,2,3,4,5,6],
            mapCardToSlot: lord => lord.place,
        });
        this.visibleLords.addCards(gamedatas.lord_slots);
        this.visibleLords.onCardClick = lord => this.onVisibleLordClick(lord);

        // Allies
        this.visibleAllies = new SlotStock<AbyssAlly>(this.allyManager, document.getElementById('visible-allies-stock'), {
            slotsIds: [1,2,3,4,5],
            mapCardToSlot: ally => ally.place,
        });
        this.visibleAllies.addCards(gamedatas.ally_explore_slots);
        this.visibleAllies.onCardClick = ally => this.onVisibleAllyClick(ally);
        
        for ( var i in gamedatas.ally_council_slots ) {
            var num = gamedatas.ally_council_slots[i];
            var deck = dojo.query('#council-track .slot-' + i);
            this.setDeckSize(deck, num);
            this.councilStacks[i] = new VoidStock<AbyssAlly>(this.allyManager, deck[0]);
        }
        this.setDeckSize(dojo.query('#lords-track .slot-0'), gamedatas.lord_deck);
        this.setDeckSize(dojo.query('#explore-track .slot-0'), gamedatas.ally_deck);

        // Threat level
        var threat_token = $('threat-token');
        dojo.removeClass(threat_token, "slot-0 slot-1 slot-2 slot-3 slot-4 slot-5");
        dojo.addClass(threat_token, "slot-" + gamedatas.threat_level);

        // Locations
        this.visibleLocations = new LineStock<AbyssLocation>(this.locationManager, document.getElementById('visible-locations-stock'), {
            center: false,
            direction: 'column',
        });
        this.visibleLocations.addCards(gamedatas.location_available);
        this.visibleLocations.onCardClick = location => this.onVisibleLocationClick(location);
        this.visibleLocationsOverflow = new LineStock<AbyssLocation>(this.locationManager, document.getElementById('locations-holder-overflow'));
        this.visibleLocationsOverflow.onCardClick = location => this.onVisibleLocationClick(location);
        this.organiseLocations();
        this.setDeckSize(dojo.query('#locations-holder .location-back'), gamedatas.location_deck);

        // Clickers
        document.getElementById('explore-track-deck').addEventListener('click', e => this.onClickExploreDeck(e));
        document.getElementById('council-track').addEventListener('click', e => this.onClickCouncilTrack(e));
        (this as any).addEventToClass('icon-monster', 'onclick', 'onClickMonsterIcon');

        // Tooltips
        // Hide this one, because it doesn't line up due to Zoom
        //(this as any).addTooltip( 'explore-track-deck', '', _('Explore'), 1 );
        (this as any).addTooltipToClass( 'pearl-holder', _( 'Pearls' ), '' );
        (this as any).addTooltipToClass( 'nebulis-holder', _( 'Nebulis' ), '' );
        (this as any).addTooltipToClass( 'key-holder', _( 'Key tokens (+ Keys from free Lords)' ), '' );
        (this as any).addTooltipToClass( 'ally-holder', _( 'Ally cards in hand' ), '' );
        (this as any).addTooltipToClass( 'monster-holder', _( 'Monster tokens' ), '' );
        (this as any).addTooltipToClass( 'lordcount-holder', _( 'Number of Lords' ), '' );
        
        (this as any).addTooltip( 'scoring-location-icon', _( 'Locations' ), '' );
        (this as any).addTooltip( 'scoring-lords-icon', _( 'Lords' ), '' );
        (this as any).addTooltip( 'scoring-affiliated-icon', _( 'Affiliated Allies' ), '' );
        (this as any).addTooltip( 'scoring-monster-tokens-icon', _( 'Monster tokens' ), '' );
        if (gamedatas.krakenExpansion) {
            (this as any).addTooltip('scoring-nebulis-icon', _( 'Nebulis' ), '');
            (this as any).addTooltip('scoring-kraken-icon', _( 'Kraken' ), '');
        }
        
        // Localisation of options box
        $('option-desc').innerHTML = _('Which Ally cards do you want to automatically pass on?');
        $('option-all').innerHTML = _('All');
        $('option-jellyfish').innerHTML = _('Jellyfish');
        $('option-crab').innerHTML = _('Crab');
        $('option-seahorse').innerHTML = _('Seahorse');
        $('option-shellfish').innerHTML = _('Shellfish');
        $('option-squid').innerHTML = _('Squid');
        $('text-total').innerHTML = _('Total');
        $('last-round').innerHTML = _('This is the last round of the game!');
        
        // Only show auto-pass options for actual players
        if (! (this as any).isSpectator) {
            // $('gameplay-options').style.display = this.bRealtime ? 'none' : 'inline-block';
            $('gameplay-options').style.display = 'inline-block';
        }
        
        // Only show the game end warning if it's the end of the game!
        $('page-title').appendChild($('last-round'));
        if (gamedatas.game_ending_player >= 0) {
            // $('gameplay-options').style.display = this.bRealtime ? 'none' : 'inline-block';
            dojo.style($('last-round'), { 'display': 'block' });
        }

        this.gamedatas.sentinels?.filter(sentinel => sentinel.playerId).forEach(sentinel => this.placeSentinelToken(sentinel.playerId, sentinel.lordId, sentinel.location, sentinel.locationArg));

        // Insert options into option box
        let me = gamedatas.players[(this as any).player_id];
        if (me) {
            if (! me.autopass) {
                me.autopass = "0;0;0;0;0";
            }
            if (me.autopass) {
                let pieces: any[] = me.autopass.split(";");
                if (pieces.length > 5) {
                    pieces = [0, 0, 0, 0, 0];
                }
                if (pieces.length >= 5) {
                    let firstValue = +pieces[0];
                    let allSame = true;
                    for (let i = 0; i < 5; i++) {
                        let max = +pieces[i];
                        if (max != firstValue) {
                            allSame = false;
                        }
                        for (let j = 0; j <= max; j++) {
                            $('autopass-'+i+'-'+j).checked = true;
                        }
                    }
                    if (allSame) {
                        $('autopass-all-'+firstValue).checked = true;
                    }
                }
            }
            
            for (let faction = 0; faction < 5; faction++) {
                for (let i = 0; i <= 5; i++) {   
                    dojo.connect($('autopass-'+faction+'-'+i), 'onclick', () => {
                    // Check only up to this
                    for (let j = 0; j <= 5; j++) {
                        $('autopass-all-'+j).checked = false;
                        $('autopass-'+faction+'-'+j).checked = j <= i;
                    }
                    self.onUpdateAutopass();
                    });
                }
            }
            
            for (let i = 0; i <= 5; i++) {   
                dojo.connect($('autopass-all-'+i), 'onclick', () => {
                    // Check only this one
                    for (let j = 0; j <= 5; j++) {
                        $('autopass-all-'+j).checked = i == j;
                    }
                    for (let faction = 0; faction < 5; faction++) {
                        for (let j = 0; j <= 5; j++) {
                            $('autopass-'+faction+'-'+j).checked = j <= i;
                        }
                    }
                    self.onUpdateAutopass();
                });
            }
        }
        
        this.organisePanelMessages();

        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    onEnteringState(stateName: string, args: any) {
        log('onEnteringState', stateName, args.args);

        // Remove all current move indicators
        dojo.query('.card-current-move').removeClass('card-current-move');
        if ((this as any).isCurrentPlayerActive()) {
            if( (this as any).checkPossibleActions( 'explore' ) ) {
                dojo.query('#explore-track-deck').addClass('card-current-move');
            }
            if( (this as any).checkPossibleActions( 'exploreTake' ) || (this as any).checkPossibleActions( 'purchase' ) ) {
                for (let i = 5; i >= 1; i--) {
                    const qr = dojo.query(`#visible-allies-stock [data-slot-id="${i}"] .ally`);
                    if (qr.length > 0) {
                        qr.addClass('card-current-move');
                        break;
                    }
                }
            }
            if (this.gamedatas.gamestate.name == 'placeKraken') {
                this.allyManager.getCardElement(args.args.ally).classList.add('card-current-move');
                dojo.query('#council-track .ally-back').addClass('card-current-move');
            }
            if( (this as any).checkPossibleActions( 'requestSupport' ) ) {
                dojo.query('#council-track .ally-back').addClass('card-current-move');
            }
            if( (this as any).checkPossibleActions( 'recruit' ) ) {
                // If affordableLords given, then highlight only affordable lords
                if (args.args && args.args._private && args.args._private.affordableLords) {
                let affordableLords = args.args._private.affordableLords;
                for (let i in affordableLords) {
                    let lordId = affordableLords[i].lord_id;
                    dojo.query('#lords-track .lord.lord-'+lordId).addClass('card-current-move');
                }
                } else {
                dojo.query('#lords-track .lord:not(.lord-back)').addClass('card-current-move');
                }
            }
            if( (this as any).checkPossibleActions( 'chooseLocation' ) && stateName != 'locationEffectBlackSmokers' ) {
                dojo.query('#locations-holder .location:not(.location-back)').addClass('card-current-move');
                dojo.query('#locations-holder-overflow .location:not(.location-back)').addClass('card-current-move');
            }
        }
        
        switch( stateName ) {
            case 'recruitPay':
                this.onEnteringRecruitPay(args.args);
                break;
            case 'lord7':
                this.onEnteringLord7();
                break;
            case 'controlPostDraw':
                this.onEnteringControlPostDraw(args.args);
                // then do entering control code
            case 'control':
                this.onEnteringControl(args.args);
                break;
            case 'locationEffectBlackSmokers':
                this.onEnteringLocationEffectBlackSmokers(args.args);
                break;
            case 'purchase': case 'explore': case 'explore2': case 'explore3':
                this.onEnteringPurchaseExplore(args.args);
                break;
            case 'lord112':
                this.onEnteringLord112(args.args);
                break;
            case 'lord116':
                this.onEnteringLord116(args.args);
                break;
        }
    }

    private onEnteringRecruitPay(args: EnteringRecruitPayArgs) {
        // highlight the given lord
        dojo.query("#lords-track .lord[data-lord-id=" + args.lord_id + "]").addClass("selected");
    }

    private onEnteringLord7() {
        // Put a red border around the player monster tokens (who aren't me)
        if ((this as any).isCurrentPlayerActive()) {
            for( var player_id in this.gamedatas.players ) {
                if (player_id != (this as any).player_id) {
                    dojo.query("#cp_board_p" + player_id + " .icon.icon-monster").addClass("clickable");
                }
            }
        }
    }

    private onEnteringLord112(args: EnteringLord112Args) {
        if ((this as any).isCurrentPlayerActive()) {
            dojo.place('<div id="ally-discard"></div>', 'game-extra');
            dojo.style($('game-extra'), "display", "block");
            const stock = new LineStock<AbyssAlly>(this.allyManager, document.getElementById(`ally-discard`));
            stock.addCards(args.allies);
            stock.onCardClick = ally => this.takeAllyFromDiscard(ally.ally_id);
        }
    }

    private onEnteringLord116(args: EnteringLord116Args) {
        // Put a green border around selectable lords
        if ((this as any).isCurrentPlayerActive()) {
            console.log(args.lords);
            args.lords.forEach(lord => 
                dojo.query(`.lord[data-lord-id="${lord.lord_id}"]`).addClass('selectable')
                //this.lordManager.getCardElement(lord).classList.add('selectable')
            );
        }
    }

    private onEnteringControlPostDraw(args: EnteringControlPostDrawArgs) {
        // Fade out the locations you can't buy
        if ((this as any).isCurrentPlayerActive()) {
            dojo.query("#locations-holder .location:not(.location-back)").addClass("unavailable");
            dojo.query("#locations-holder-overflow .location:not(.location-back)").addClass("unavailable");
            for( var iLocationId in args.location_ids ) {
                var location_id = args.location_ids[iLocationId];
                dojo.query("#locations-holder .location.location-" + location_id).removeClass("unavailable");
                dojo.query("#locations-holder-overflow .location.location-" + location_id).removeClass("unavailable");
            }
        }
    }

    private onEnteringControl(args: EnteringControlPostDrawArgs) {
        dojo.query(".free-lords .lord").removeClass("selected");
        for( var iLordId in args.default_lord_ids ) {
            var lord_id = args.default_lord_ids[iLordId];
            dojo.query("#player-panel-" + (this as any).player_id + " .free-lords .lord.lord-" + lord_id).addClass("selected");
        }
    }

    private onEnteringLocationEffectBlackSmokers(args: EnteringLocationEffectBlackSmokersArgs) {
        // Draw all the locations in a div at the top. Register to each an onclick to select it.
        if ((this as any).isCurrentPlayerActive()) {
            dojo.place('<div id="ally-discard"></div>', 'game-extra');
            dojo.style($('game-extra'), "display", "block");
            const stock = new LineStock<AbyssLocation>(this.locationManager, document.getElementById(`ally-discard`), {
                direction: 'column',
            });
            stock.addCards(args._private.locations);
            stock.onCardClick = location => this.onVisibleLocationClick(location);
        }
    }

    private onEnteringPurchaseExplore(args: EnteringPurchaseArgs) {
        // Disable players who have passed
        (this as any).enableAllPlayerPanels();
        for( var iPlayer in args.passed_players ) {
            (this as any).disablePlayerPanel( args.passed_players[iPlayer] );
        }
        
        // Underline the first player
        let first_player = args.first_player;
        dojo.query('a', $('player_name_' + first_player)).style('text-decoration', 'underline');
    }

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    onLeavingState(stateName: string) {
        log('onLeavingState', stateName);
        
        $('game-extra').innerHTML = '';
        dojo.style($('game-extra'), "display", "none");

        switch( stateName ) {
            case 'recruitPay':
                dojo.query("#lords-track .lord").removeClass("selected");
                dojo.query("#player-hand .ally").removeClass("selected");
                break;
            case 'lord7':
                // Put a red border around the player monster tokens (who aren't me)
                dojo.query(".cp_board .icon.icon-monster").removeClass("clickable");
                break;
            case 'controlPostDraw': case 'control':
                dojo.query("#locations-holder .location").removeClass("unavailable");
                dojo.query("#locations-holder-overflow .location").removeClass("unavailable");
            case 'lord19': case 'lord19b':
                dojo.query(".free-lords .lord").removeClass("selected");
                break;
            case 'purchase': case 'explore': case 'explore2': case 'explore3':
                (this as any).enableAllPlayerPanels();
                dojo.query('.player-name a').style('text-decoration', '');
                break;
            case 'lord116':
                this.onLeavingLord116();
                break;
        }
    }

    private onLeavingLord116() {
        dojo.query(`.lord.selectable`).removeClass('selectable');
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons(stateName: string, args: any) {
        //log('onUpdateActionButtons', stateName, args);

        if ((this as any).isCurrentPlayerActive() && ["plotAtCourt", "action", "secondStack", "explore", "explore2", "explore3", "chooseMonsterReward", "recruitPay", "affiliate", "cleanupDiscard", "controlPostDraw", "unusedLords"].includes(stateName)) {
            dojo.query("#player-panel-"+(this as any).player_id+" .free-lords .lord").forEach(node => {
                // unused, and unturned...
                var used = +dojo.attr(node, "data-used");
                var turned = +dojo.attr(node, "data-turned");
                var effect = +dojo.attr(node, "data-effect");

                if (! used && ! turned && effect == 3) {
                    dojo.addClass(node, "unused");
                }
            });
        } else {
            dojo.query(".lord").removeClass("unused");
        }

        if( (this as any).isCurrentPlayerActive() ) {
            switch( stateName ) {
                case 'purchase':
                    const purchageArgs = args as EnteringPurchaseArgs;
                    const cost = purchageArgs.cost;
                    (this as any).addActionButton('button_purchase', _('Purchase') + ` (${cost} <i class="icon icon-pearl"></i>)`, () => this.onPurchase(0));
                    if (!purchageArgs.canPayWithPearls) {
                        document.getElementById('button_purchase').classList.add('disabled');
                    }
                    if (purchageArgs.withNebulis) {
                        Object.keys(purchageArgs.withNebulis).forEach(i => {
                            (this as any).addActionButton(`button_purchase_with${i}Nebulis`, _('Purchase') + ` (${ cost - Number(i) > 0 ? `${cost - Number(i)} <i class="icon icon-pearl"></i> ` : ''}${i} <i class="icon icon-nebulis"></i>)`, event => this.onPurchase(Number(i)));
                            if (!purchageArgs.withNebulis[i]) {
                                document.getElementById(`button_purchase_with${i}Nebulis`).classList.add('disabled');
                            }
                        });
                    }
                    (this as any).addActionButton( 'button_pass', _('Pass'), 'onPass' );
                    break;
                case 'chooseMonsterReward':
                    for (var i in args.rewards) {
                        var r: string = args.rewards[i];
                        r = r.replace(/K/g, "<i class=\"icon icon-key\"></i>");
                        r = r.replace(/P/g, "<i class=\"icon icon-pearl\"></i>");
                        r = r.replace(/M/g, "<i class=\"icon icon-monster\"></i>");
                        (this as any).addActionButton( 'button_reward_' + i, r, 'onChooseMonsterReward' );
                    }
                    break;
                case 'recruitPay':
                    const recruitArgs = args as EnteringRecruitPayArgs;
                    (this as any).addActionButton( 'button_recruit', _('Recruit'), () => this.onRecruit(0));

                    const recruitButton = document.getElementById('button_recruit');
                    recruitButton.innerHTML = _('Recruit') + ' ('+recruitArgs.cost+' <i class="icon icon-pearl"></i>)';
                    recruitButton.classList.toggle('disabled', recruitArgs.cost > recruitArgs.pearls);
                    recruitButton.dataset.baseCost = '' + recruitArgs.cost;
                    recruitButton.dataset.pearls = '' + recruitArgs.pearls;
                    recruitButton.dataset.nebulis = '' + recruitArgs.nebulis;

                    if (recruitArgs.withNebulis) {
                        Object.keys(recruitArgs.withNebulis).forEach(i => {
                            (this as any).addActionButton(`button_recruit_with${i}Nebulis`, _('Recruit') + ` (${ args.cost - Number(i) > 0 ? `${args.cost - Number(i)} <i class="icon icon-pearl"></i> ` : ''}${i} <i class="icon icon-nebulis"></i>)`, () => this.onRecruit(Number(i)));
                            const button = document.getElementById(`button_recruit_with${i}Nebulis`);
                            button.classList.toggle('disabled', recruitArgs.nebulis < Number(i) || (recruitArgs.cost - Number(i)) > recruitArgs.pearls);
                        });
                    }

                    (this as any).addActionButton( 'button_pass', _('Cancel'), event => this.onPass(event));
                    break;
                case 'affiliate':
                    for (var i in args.allies) {
                        var ally = args.allies[i];
                        var r: string = ally.value + ' ' + this.allyManager.allyNameText(ally.faction);
                        var btnId = 'button_affiliate_' + ally.ally_id;
                        (this as any).addActionButton( btnId, r, 'onChooseAffiliate' );
                        dojo.addClass($(btnId), 'affiliate-button')
                    }
                    break;
                case 'plotAtCourt':
                    (this as any).addActionButton( 'button_plot', _('Plot') + ` (1 <i class="icon icon-pearl"></i>)`, 'onPlot' );
                    if (args.canPlaceSentinel) {
                        (this as any).addActionButton( 'button_place_sentinel', _('Place sentinel'), () => this.goToPlaceSentinel());
                    }
                    (this as any).addActionButton( 'button_pass', _('Pass'), 'onPass' );
                    break;
                case 'action':
                    if (args.canPlaceSentinel) {
                        (this as any).addActionButton( 'button_place_sentinel', _('Place sentinel'), () => this.goToPlaceSentinel());
                    }
                    break;
                case 'lord23': case 'lord26': case 'locationEffectBlackSmokers': case 'lord19': case 'lord22': case 'lord19b': case 'unusedLords':
                    (this as any).addActionButton( 'button_pass', _('Pass'), 'onPass' );
                    break;
                case 'lord12': case 'lord17': case 'lord21':
                    (this as any).addActionButton( 'button_pass', _('Cancel'), 'onPass' );
                    break;
                case 'lord2': case 'lord5': case 'cleanupDiscard': case 'postpurchaseDiscard':
                    (this as any).addActionButton( 'button_discard', _('Discard'), 'onDiscard' );
                    break;
                case 'lord7':
                    // Put a red border around the player monster tokens (who aren't me)
                    for( var player_id in this.gamedatas.players ) {
                        if (player_id != (this as any).player_id) {
                            var num_tokens = +$('monstercount_p' + player_id).innerHTML;
                            if (num_tokens > 0) {
                                (this as any).addActionButton( 'button_steal_monster_token_' + player_id, this.gamedatas.players[player_id].name, 'onClickMonsterIcon' );
                            }
                        }
                    }
                    break;
                case 'control':
                    var s = _('Draw ${n}');
                    let location_deck = dojo.query('.location.location-back')[0];
                    let location_deck_size = +dojo.attr(location_deck, 'data-size');
                    for (let i = 1; i <= 4; i++) {
                        if (location_deck_size < i) continue;
                        (this as any).addActionButton( 'button_draw_' + i, dojo.string.substitute( s, {n: i} ), 'onDrawLocation' );
                    }
                    break;
                case 'martialLaw':
                    const martialLawArgs = args as EnteringMartialLawArgs;
                    if (martialLawArgs?.diff > 0) {
                        (this as any).addActionButton('button_discard', _('Discard selected allies'), () => this.onDiscard());

                        var ally_ids = [];
                        dojo.query("#player-hand .ally.selected").forEach(node => 
                            ally_ids.push(+dojo.attr(node, 'data-ally-id'))
                        );
                        if (!ally_ids.length) {
                            document.getElementById('button_discard').classList.add('disabled');
                        }

                        (this as any).addActionButton('button_payMartialLaw', _('Pay') + ` ${martialLawArgs.diff} <i class="icon icon-pearl"></i>`, () => this.payMartialLaw());
                        if (!martialLawArgs.canPay) {
                            document.getElementById('button_payMartialLaw').classList.add('disabled');
                        }
                    }
                    break;
                case 'fillSanctuary':
                    (this as any).addActionButton('button_continue', _('Continue searching'), () => this.searchSanctuary());
                    (this as any).addActionButton('button_stop', _('Stop searching'), () => this.stopSanctuarySearch());
                    break;
                case 'lord104':
                    const lord104Args = args as EnteringLord104Args;   
                    if (lord104Args.nebulis == 1) {   
                        lord104Args.playersIds.forEach(playerId => {
                            const player = this.getPlayer(playerId);
                            (this as any).addActionButton(`giveNebulisTo${playerId}-button`, player.name, () => this.giveNebulisTo([playerId]));
                            document.getElementById(`giveNebulisTo${playerId}-button`).style.border = `3px solid #${player.color}`;
                        });
                    } else {
                        lord104Args.playersIds.forEach(playerId => {
                            lord104Args.playersIds.filter(secondPlayerId => secondPlayerId != playerId).forEach(secondPlayerId => {
                                const player = this.getPlayer(playerId);
                                const secondPlayer = this.getPlayer(secondPlayerId);
                                if (!document.getElementById(`giveNebulisTo${playerId}-${secondPlayerId}-button`) && !document.getElementById(`giveNebulisTo${secondPlayerId}-${playerId}-button`)) {
                                    (this as any).addActionButton(`giveNebulisTo${playerId}-${secondPlayerId}-button`, _('${player_name} and ${player_name2}').replace('${player_name}', player.name).replace('${player_name2}', secondPlayer.name), () => this.giveNebulisTo([playerId, secondPlayerId]));
                                }
                            });
                        });
                    }
                    break;
                case 'lord114':
                    for (let i = 0; i < 5; i++) {
                        (this as any).addActionButton(`selectAllyRace${i}`, this.allyManager.allyNameText(i), () => this.selectAllyRace(i));
                        document.getElementById(`selectAllyRace${i}`).classList.add('affiliate-button');
                    }
                    break;
                case 'giveKraken':
                    const giveKrakenArgs = args as EnteringGiveKrakenArgs;      
                    giveKrakenArgs.playersIds.forEach(playerId => {
                        const player = this.getPlayer(playerId);
                        (this as any).addActionButton(`giveKraken${playerId}-button`, player.name, () => this.giveKraken(playerId));
                        document.getElementById(`giveKraken${playerId}-button`).style.border = `3px solid #${player.color}`;
                    });
                    break;
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Utility methods

    public connectTooltip(node: any, html: string | Function, offsetType: string) {
        let tt = $('abs-tooltip-0');
        dojo.connect(node, "onmouseenter", () => {
          if ((this as any).prefs[200].value == 1) {
            return;
          }
          let r = node.getBoundingClientRect();
          let outer = $('game-holder').getBoundingClientRect();
          let left = r.left - outer.left;
          let top = r.top - outer.top;
          
          let zoomSupported = this.useZoom;
          
          // Always include content zoom
          let contentZoom = zoomSupported ? (+dojo.style($('page-content'), 'zoom') || 1) : 1;
          let totalZoom = contentZoom;
          
          // Only include game zoom if the node is in the zoomed element
          let gameZoom = 1;
          if (zoomSupported && dojo.hasClass($('game-board-holder'), "playmat") && $('game-board-holder').contains(node)) {
            gameZoom = this.zoomLevel;
          }
          if (dojo.hasClass($('game-board-holder'), "playmat") && $('locations-holder-holder').contains(node)) {
            gameZoom *= zoomSupported ? (dojo.style($('locations-holder-holder'), 'zoom') || 1) : 1;
          }
          
          totalZoom *= gameZoom;
          top *= totalZoom;
          left *= totalZoom;
          
          if (typeof html === 'function') {
            tt.innerHTML = html.call(this);
          } else {
            tt.innerHTML = html;
          }
          
          // If there is room above, put it there...
          let offsetX = 0;
          let offsetY = 0;
          if (offsetType === "lord") {
            offsetX = 44 * gameZoom;
            offsetY = 68 * gameZoom;
          } else if (offsetType === "ally") {
            offsetX = 29 * gameZoom;
            offsetY = 43 * gameZoom;
          }
          let padding = 20;
          let positions = ["right", "top", "bottom", "left"];
          let originalTop = top;
          let originalLeft = left;
          for (let i in positions) {
            top = originalTop;
            left = originalLeft;
            
            let position = positions[i];
            if (position == "right") {
              left += node.offsetWidth * totalZoom + padding;
              left += offsetX;
              top -= offsetY;
            } else if (position == "top") {
              top -= tt.offsetHeight * contentZoom + padding;
              left -= offsetX;
              top -= offsetY;
            } else if (position == "bottom") {
              top += node.offsetHeight * totalZoom + padding;
              left -= offsetX;
              top += offsetY;
            } else if (position == "left") {
              left -= tt.offsetWidth * contentZoom + padding;
              left -= offsetX;
              top -= offsetY;
            }
            
            // If it fits, stop here
            let right = left + tt.offsetWidth * contentZoom;
            let bottom = top + tt.offsetHeight * contentZoom;
            if (right > $('page-content').offsetWidth) {
              continue;
            }
            if (left < 0) {
              continue;
            }
            let scrollLimit = window.scrollY - $('page-content').offsetTop;
            if (top < scrollLimit) {
              continue;
            }
            
            break;
          }
          
          dojo.style(tt, {'opacity': '1', 'top': top + 'px', 'left': left + 'px'});
        });
        dojo.connect(node, "onmouseleave", () => dojo.style(tt, {'opacity': '0'}));
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    private getPlayer(playerId: number): AbyssPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }
    
    public organisePanelMessages() {
        this.playersTables.forEach(playerTable => playerTable.organisePanelMessages());
    }

    private setDeckSize(deck /*dojo query result*/, num: number) {
        deck.removeClass("deck-empty deck-low deck-medium deck-full");
        if (num == 0) {
            deck.addClass("deck-empty");
        } else if (num <= 2) {
            deck.addClass("deck-low");
        } else if (num <= 5) {
            deck.addClass("deck-medium");
        } else {
            deck.addClass("deck-full");
        }

        // Set deck-size data
        deck.attr("data-size", num);

        // If it's a council stack, then add tooltip
        for (let i = 0; i < deck.length; i++) {
            var node = deck[i];
            let deckSize = dojo.query('.deck-size', node);
            if (deckSize.length > 0) {
                let n = deckSize[0];
                n.innerHTML = num > 0 ? num : "";
            }
        }
    }

    private createPlayerPanels(gamedatas: AbyssGamedatas) {
        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);

            // Setting up players boards if needed
            var player_board_div = $('player_board_'+playerId);
            let html = `
            <div id="cp_board_p${player.id}" class="cp_board" data-player-id="${player.id}">
                <span class="pearl-holder spacer" id="pearl-holder_p${player.id}"><i class="icon icon-pearl"></i><span class="spacer" id="pearlcount_p${player.id}">${player.pearls}</span></span>`;

            if (gamedatas.krakenExpansion) {
                html += `<span class="nebulis-holder spacer" id="nebulis-holder_p${player.id}"><i class="icon icon-nebulis"></i><span class="spacer" id="nebuliscount_p${player.id}">${player.nebulis}</span></span>`;
            }

            html += `    <span class="key-holder spacer" id="key-holder_p${player.id}"><i class="icon icon-key"></i><span class="spacer" id="keycount_p${player.id}">${player.keys}</span><span class="key-addendum">(+<span id="lordkeycount_p${player.id}"></span>)</span></span>
                <span class="ally-holder spacer" id="ally-holder_p${player.id}"><i class="icon icon-ally"></i><span class="spacer" id="allycount_p${player.id}">${player.hand_size}</span></span>
                <span class="monster-holder spacer" id="monster-holder_p${player.id}"><i class="icon icon-monster"></i><span class="spacer" id="monstercount_p${player.id}">${player.num_monsters}</span></span>
                <span class="lordcount-holder spacer"><i class="icon icon-lord"></i><span id="lordcount_p${player.id}">${player.lords.length}</span></span>
                <div class="monster-hand" id="monster-hand_p${player.id}"></div>
            </div>`;
            dojo.place( html, player_board_div );

            

            // kraken token
            dojo.place(`<div id="player_board_${player.id}_krakenWrapper" class="krakenWrapper"></div>`, `player_board_${player.id}`);

            if (gamedatas.kraken == playerId) {
                this.placeKrakenToken(playerId);
            }
            
            // Set up scoring table in advance (helpful for testing!)
            let splitPlayerName = '';
            let chars = player.name.split("");
            for (let i in chars) {
                splitPlayerName += `<span>${chars[i]}</span>`;
            }
            $('scoring-row-players').innerHTML += `<td><span id="scoring-row-name-p${playerId}" style="color:#${player.color};"><span>${splitPlayerName}</span></span></td>`;
            
            $('scoring-row-location').innerHTML += `<td id="scoring-row-location-p${playerId}"></td>`;
            $('scoring-row-lord').innerHTML += `<td id="scoring-row-lord-p${playerId}"></td>`;
            $('scoring-row-affiliated').innerHTML += `<td id="scoring-row-affiliated-p${playerId}"></td>`;
            $('scoring-row-monster').innerHTML += `<td id="scoring-row-monster-p${playerId}"></td>`;
            if (gamedatas.krakenExpansion) {
                $('scoring-row-nebulis').innerHTML += `<td id="scoring-row-nebulis-p${playerId}"></td>`;
                $('scoring-row-kraken').innerHTML += `<td id="scoring-row-kraken-p${playerId}"></td>`;  
            }
            
            $('scoring-row-total').innerHTML += `<td id="scoring-row-total-p${playerId}"></td>`;
        });
    }

    private incPearlCount(playerId: number, inc: number) {
        $('pearlcount_p' + playerId).innerHTML = +($('pearlcount_p' + playerId).innerHTML) + inc;
    }
    private incNebulisCount(playerId: number, inc: number) {
        $('nebuliscount_p' + playerId).innerHTML = +($('nebuliscount_p' + playerId).innerHTML) + inc;
    }

    private placeKrakenToken(playerId: number) {
        const krakenToken = document.getElementById('krakenToken');
        if (krakenToken) {
            if (playerId == 0) {
                (this as any).fadeOutAndDestroy(krakenToken);
            } else {
                const parentElement = krakenToken.parentElement;

                document.getElementById(`player_board_${playerId}_krakenWrapper`).appendChild(krakenToken);
                stockSlideAnimation({
                    element: krakenToken,
                    fromElement: parentElement
                });
            }
        } else {
            if (playerId != 0) {
                dojo.place('<div id="krakenToken" class="token"></div>', `player_board_${playerId}_krakenWrapper`);

                (this as any).addTooltipHtml('krakenToken', _("The Kraken figure allows players to identify, during the game, the most corrupt player. The figure is given to the first player to receive any Nebulis. As soon as an opponent ties or gains more Nebulis than the most corrupt player, they get the Kraken figure"));
            }
        }
    }

    private getSentinelToken(lordId: number) {
        let div = document.getElementById(`sentinel-${lordId}`);
        if (!div) {
            div = document.createElement('div');
            div.id = `sentinel-${lordId}`;
            div.classList.add('sentinel-token');
            div.dataset.lordId = `${lordId}`;
        }
        return div;
    }

    private placeSentinelToken(playerId: number, lordId: number, location: string, locationArg: number) {
        const sentinel = this.getSentinelToken(lordId);
        const parentElement = sentinel.parentElement;

        switch (location) {
            case 'player':
                const sentinelsElement = document.getElementById(`player-panel-${playerId}-sentinels`);
                sentinelsElement.appendChild(sentinel);
                if (parentElement) {
                    stockSlideAnimation({
                        element: sentinel,
                        fromElement: parentElement
                    });
                }
                break;
            case 'lord':
                const lordElement = this.lordManager.getCardElement({ lord_id: locationArg } as AbyssLord);
                lordElement.appendChild(sentinel);
                if (parentElement) {
                    stockSlideAnimation({
                        element: sentinel,
                        fromElement: parentElement
                    });
                }
                break;
            case 'council':
                const councilElement = document.getElementById(`council-track-${locationArg}`);
                councilElement.appendChild(sentinel);
                if (parentElement) {
                    stockSlideAnimation({
                        element: sentinel,
                        fromElement: parentElement
                    });
                }
                break;
            case 'location':
                const locationElement = this.locationManager.getCardElement({ location_id: locationArg } as AbyssLocation);
                locationElement.appendChild(sentinel);
                if (parentElement) {
                    stockSlideAnimation({
                        element: sentinel,
                        fromElement: parentElement
                    });
                }
                break;

        }
    }

    private organiseLocations() {
        // If on playmat:
        if (dojo.hasClass($('game-board-holder'), "playmat")) {
            // move all beyond 5 into the overflow
            const locations = this.visibleLocations.getCards();
            if (locations.length > 5) {
                this.visibleLocationsOverflow.addCards(locations.slice(5));
            }
        } else {
            const locations = this.visibleLocationsOverflow.getCards();
            if (locations.length > 0) {
                this.visibleLocations.addCards(locations);
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Player's action

    /*

        Here, you are defining methods to handle player's action (ex: results of mouse click on
        game objects).

        Most of the time, these methods:
        _ check the action is possible at this game state.
        _ make a call to the game server

    */
    onDiscard() {
        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(node => 
            ally_ids.push(+dojo.attr(node, 'data-ally-id'))
        );

        this.discardAllies(ally_ids);
    }

    onRecruit(withNebulis: number) {
        if (!(this as any).checkAction('pay')) {
            return;
        }

        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(node => {
            ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });

        this.takeAction('pay', {
            ally_ids: ally_ids.join(';'),
            withNebulis,
        });
    }

    onChooseAffiliate(evt) {
        if(!(this as any).checkAction( 'affiliate' )) {
        return;
        }

        var ally_id = +evt.currentTarget.id.replace('button_affiliate_', '');

        this.takeAction('affiliate', {
            ally_id,
        });
    }

    onClickCouncilTrack(evt) {
        if (dojo.hasClass(evt.target, 'ally')) {
            // Draw this stack??
            dojo.stopEvent( evt );

            var faction = dojo.attr(evt.target, 'data-faction');

            if (this.gamedatas.gamestate.name === 'placeSentinel') {
                this.placeSentinel(2, faction);
                return;
            } else if (this.gamedatas.gamestate.name === 'placeKraken') {
                this.placeKraken(faction);
                return;
            }

            if( ! (this as any).checkAction( 'requestSupport' ) ) {
                return;
            }

            this.takeAction('requestSupport', {
                faction,
            });
        }
    }

    onClickPlayerLocation(location: AbyssLocation): void {
        var target = this.locationManager.getCardElement(location);
        if (!dojo.hasClass(target, 'location-back')) {

            if (this.gamedatas.gamestate.name === 'placeSentinel') {
                this.placeSentinel(3, location.location_id);
                return;
            }

            if( ! (this as any).checkAction( 'chooseLocation' ) ) {
            return;
            }
            
            // If you select Black Smokers with an empty deck, warn!
            if (location.location_id == 10) {
                let location_deck = dojo.query('.location.location-back')[0];
                let location_deck_size = +dojo.attr(location_deck, 'data-size');
                if (location_deck_size == 0) {
                (this as any).confirmationDialog( _('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch( this, function() {
                    this.chooseLocation(location.location_id);
                    } ) );
                    return;
                }
            }
            
            this.chooseLocation(location.location_id);
        }
    }

    private onVisibleLocationClick(location: AbyssLocation) {
        const location_id = location.location_id;

        if (this.gamedatas.gamestate.name === 'placeSentinel') {
            this.placeSentinel(3, location_id);
            return;
        }

        if( ! (this as any).checkAction( 'chooseLocation' ) ) {
            return;
        }
        
        // If you select Black Smokers with an empty deck, warn!
        if (location_id == 10) {
            let location_deck = dojo.query('.location.location-back')[0];
            let location_deck_size = +dojo.attr(location_deck, 'data-size');
            if (location_deck_size == 0) {
            (this as any).confirmationDialog( _('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch( this, function() {
                this.chooseLocation(location_id);
                } ) );
                return;
            }
        }
        
        this.chooseLocation(location_id);
    }

    private chooseLocation(locationId: number) {
        var lord_ids = [];
        dojo.query("#player-panel-" + (this as any).player_id + " .free-lords .lord.selected").forEach(node =>
        lord_ids.push(+dojo.attr(node, 'data-lord-id'))
        );

        this.takeAction('chooseLocation', {
            location_id: locationId,
            lord_ids: lord_ids.join(';'),
        });
    }

    onVisibleLordClick(lord: AbyssLord) {
        if (this.gamedatas.gamestate.name === 'placeSentinel') {
            this.placeSentinel(1, lord.lord_id);
        } else {
            this.recruit(lord.lord_id);
        }
    }

    private recruit(lordId: number) {
        if (!(this as any).checkAction('recruit')) {
            return;
        }

        this.takeAction('recruit', {
            lord_id: lordId,
        },);
    }

    onClickExploreDeck( evt ) {
        dojo.stopEvent( evt );

        if (!(this as any).checkAction('explore')) {
            return;
        }

        this.takeAction('explore');
    }

    onVisibleAllyClick(ally: AbyssAlly) {
        if((this as any).checkAction('purchase', true)) {
            this.onPurchase(0); // TODO BGA ?
            return;
        }

        if(!(this as any).checkAction('exploreTake')) {
            return;
        }

        this.takeAction('exploreTake', {
            slot: ally.place,
        });
    }

    onPurchase(withNebulis: number) {
        if(!(this as any).checkAction('purchase')) {
            return;
        }

        this.takeAction('purchase', {
            withNebulis
        });
    }

    onPass( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'pass' ) ) {
        return;
        }

        this.takeAction('pass');
    }

    onPlot( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'plot' ) ) {
        return;
        }

        this.takeAction('plot');
    }

    onChooseMonsterReward( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'chooseReward' ) ) {
        return;
        }

        var option = +evt.currentTarget.id.replace("button_reward_", '');

        this.takeAction('chooseReward', {
            option,
        });
    }

    onClickPlayerHand(ally: AbyssAlly) {
        if( (this as any).checkAction( 'pay', true ) ) {
            this.allyManager.getCardElement(ally).classList.toggle('selected');

            const recruitButton = document.getElementById('button_recruit');
            var lord = dojo.query("#lords-track .lord.selected")[0];
            const baseCost = Number(recruitButton.dataset.baseCost);
            const pearls = Number(recruitButton.dataset.pearls);
            const nebulis = Number(recruitButton.dataset.nebulis);
            var diversity = +dojo.attr(lord, 'data-diversity');

            // Value selected
            let value = 0;
            dojo.query("#player-hand .ally.selected").forEach(node => {
                value += +dojo.attr(node, 'data-value');
            });
            let shortfall = baseCost - value;
            if (shortfall < 0) { shortfall = 0; }

            // Update "Recruit" button
            recruitButton.innerHTML = _('Recruit') + ' ('+shortfall+' <i class="icon icon-pearl"></i>)';
            recruitButton.classList.toggle('disabled', shortfall > pearls);

            [1, 2].forEach(i => {
                const button = document.getElementById(`button_recruit_with${i}Nebulis`);
                if (button) {
                    const cost = shortfall;
                    button.innerHTML = _('Recruit') + ` (${ cost - i > 0 ? `${cost - i} <i class="icon icon-pearl"></i> ` : ''}${i} <i class="icon icon-nebulis"></i>)`;
                    button.classList.toggle('disabled', nebulis < i || (cost - i) > pearls || shortfall < i);
                }
            });

        } else if( (this as any).checkAction( 'discard', true ) ) {
            // Multi-discard: select, otherwise just discard this one
            this.allyManager.getCardElement(ally).classList.toggle('selected');

            if (this.gamedatas.gamestate.name === 'martialLaw') {
                var ally_ids = [];
                dojo.query("#player-hand .ally.selected").forEach(node => 
                    ally_ids.push(+dojo.attr(node, 'data-ally-id'))
                );
                document.getElementById('button_discard').classList.toggle('disabled', !ally_ids.length);
            }

            // Discard this card directly?
            // var ally_id = dojo.attr(evt.target, 'data-ally-id');
            // (this as any).ajaxcall( "/abyss/abyss/discard.html", { lock: true, ally_ids: ally_id }, this,
            //   function( result ) {},
            //   function( is_error) {}
            // );
        } else if( (this as any).checkAction( 'selectAlly', true ) ) {
            this.takeAction('selectAlly', { 
                ally_id: ally.ally_id 
            });
        }
    }

    onClickMonsterIcon( evt ) {
        if (dojo.hasClass(evt.target, 'clickable')) {
        if( (this as any).checkAction( 'chooseMonsterTokens', true ) ) {
            dojo.stopEvent( evt );

            // Discard this card...
            var player_id: Number = dojo.attr(dojo.query(evt.target).closest('.cp_board')[0], 'data-player-id');
            this.takeAction('chooseMonsterTokens', {
                player_id,
            });
        }
        } else {
            if( (this as any).checkAction( 'chooseMonsterTokens' ) ) {
            dojo.stopEvent( evt );

            // Discard this card...
            var player_id: Number = +evt.target.id.replace("button_steal_monster_token_", "");
            this.takeAction('chooseMonsterTokens', {
                player_id,
            });
            }
        }
    }

    onClickPlayerFreeLord(lord: AbyssLord) {
        if( (this as any).checkAction( 'selectLord', true ) ) {
            this.takeAction('selectLord', {
                lord_id: lord.lord_id
            });
        } else if( (this as any).checkAction( 'lordEffect', true ) ) {
            this.takeAction('lordEffect', {
                lord_id: lord.lord_id
            });
        } else if( (this as any).checkAction( 'chooseLocation', true ) ) {
            const target = this.lordManager.getCardElement(lord);

            // Only allow this on your own Lords
            var panel = target.closest('.player-panel');
            if (panel.id == "player-panel-" + this.getPlayerId()) {
                dojo.toggleClass(target, "selected");
            }
        }
    }

    onClickPlayerLockedLord(lord: AbyssLord) {
        const target = this.lordManager.getCardElement(lord);
        if (target.classList.contains('selectable') && this.gamedatas.gamestate.name === 'lord116') {
            this.freeLord(lord.lord_id);
            return;
        }
    }
    
    onUpdateAutopass() {
        let autopass = "";
        for (let faction = 0; faction < 5; faction++) {
        let max = 0;
        for (let j = 0; j <= 5; j++) {
            if ($('autopass-'+faction+'-'+j).checked) {
                max = j;
            } else {
                break;
            }
        }
        if (autopass.length > 0) {
            autopass += ";";
        }
        autopass += "" + max;
        }

        this.takeNoLockAction('setAutopass', {
            autopass,
        });
    }

    onDrawLocation( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'drawLocations' ) ) {
        return;
        }

        var num = +evt.currentTarget.id.replace('button_draw_', '');

        this.takeAction('drawLocations', {
            num,
        });
    }

    private payMartialLaw() {
        if(!(this as any).checkAction('payMartialLaw')) {
            return;
        }

        this.takeAction('payMartialLaw');
    }

    private searchSanctuary() {
        if(!(this as any).checkAction('searchSanctuary')) {
            return;
        }

        this.takeAction('searchSanctuary');
    }

    private stopSanctuarySearch() {
        if(!(this as any).checkAction('stopSanctuarySearch')) {
            return;
        }

        this.takeAction('stopSanctuarySearch');
    }

    private takeAllyFromDiscard(id: number) {
        if(!(this as any).checkAction('takeAllyFromDiscard')) {
            return;
        }

        this.takeAction('takeAllyFromDiscard', {
            id,
        });
    }

    private freeLord(id: number) {
        if(!(this as any).checkAction('freeLord')) {
            return;
        }

        this.takeAction('freeLord', {
            id,
        });
    }

    private selectAllyRace(faction: number) {
        if(!(this as any).checkAction('selectAllyRace')) {
            return;
        }

        this.takeAction('selectAllyRace', {
            faction,
        });
    }
    
    public discardAllies(ids: number[]) {
        if(!(this as any).checkAction('discard')) {
            return;
        }

        this.takeAction('discard', {
            ally_ids: ids.join(';'),
        });
    }

    private giveKraken(playerId: number) {
        if(!(this as any).checkAction('giveKraken')) {
            return;
        }

        this.takeAction('giveKraken', {
            playerId,
        });
    }

    private goToPlaceSentinel() {
        if(!(this as any).checkAction('goToPlaceSentinel')) {
            return;
        }

        this.takeAction('goToPlaceSentinel');
    }

    private placeSentinel(location: number, locationArg: number) {
        if(!(this as any).checkAction('placeSentinel')) {
            return;
        }

        this.takeAction('placeSentinel', {
            location,
            locationArg,
        });
    }

    private giveNebulisTo(playersIds: number[]) {
        if(!(this as any).checkAction('giveNebulisTo')) {
            return;
        }

        this.takeAction('giveNebulisTo', {
            playersIds: playersIds.join(';'),
        });
    }

    private placeKraken(faction: number) {
        if(!(this as any).checkAction('placeKraken')) {
            return;
        }

        this.takeAction('placeKraken', {
            faction
        });
    }

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/abyss/abyss/${action}.html`, data, this, () => {});
    }

    public takeNoLockAction(action: string, data?: any) {
        data = data || {};
        (this as any).ajaxcall(`/abyss/abyss/${action}.html`, data, this, () => {});
    }


    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your abyss.game.php file.

    */
    setupNotifications() {        
        let num_players = Object.keys(this.gamedatas.players).length;

        const notifs = [
            ['explore', 1],
            ['takeAllyFromDiscard', 500],
            ['purchase', 500],
            ['exploreTake', 1000],
            ['setThreat', 1],
            ['lootReward', 1],
            ['monsterReward', 1],
            ['monsterTokens', 1],
            ['monsterHand', 1],
            ['discardCouncil', 1],
            ['requestSupport', 1],
            ['requestSupportCards', 1],
            ['recruit', 1],
            ['refillLords', 1],
            ['affiliate', 1],
            ['plot', 1],
            ['allyDeckShuffle', 1],
            ['diff', 1],
            ['disable', 1],
            ['moveLordsRight', 1],
            ['newLocations', 1],
            ['control', 1],
            ['loseLocation', 1],
            ['score', 1],
            ['useLord', 1],
            ['refreshLords', 1],
            ['finalRound', 1],
            ['payMartialLaw', 1],
            ['newLoot', 500],
            ['highlightLootsToDiscard', 1000],
            ['discardLoots', 1],
            ['searchSanctuaryAlly', 500],
            ['kraken', 500],
            ['placeSentinel', 500],
            ['placeKraken', 500],
            ['endGame_scoring', 5000 * num_players + 3000],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }
    
    setScoringArrowRow(stage: string) {
        dojo.query('#game-scoring .arrow').style('visibility', 'hidden');
        dojo.query('.arrow', $('scoring-row-'+stage)).style('visibility', 'visible');
    }
    
    setScoringRowText(stage: string, player_id: string, value: string) {
            $('scoring-row-' + stage + '-p' + player_id).innerHTML = value;
        }
    
    setScoringRowWinner(winner_ids: string[], lines: string[]) {
        for (let i in winner_ids) {
            let player_id = winner_ids[i];
            dojo.addClass($('scoring-row-name-p' + player_id), 'wavetext');
            
            lines.forEach(stage =>
                dojo.style($('scoring-row-'+stage+'-p' + player_id), {'backgroundColor': 'rgba(255, 215, 0, 0.3)'})
            );
        }
    }
    
    notif_finalRound( notif: Notif<NotifFinalRoundArgs>) {
        let playerId = notif.args.player_id;
        
        this.gamedatas.game_ending_player = playerId;
        dojo.style($('last-round'), { 'display': 'block' });
    }
    
    notif_endGame_scoring ( notif: Notif<NotifEndGameScoringArgs> ) {
        let breakdowns = notif.args.breakdowns;
        let winnerIds = notif.args.winner_ids;
        
        // Don't show the "final round" message if at the actual end
        dojo.style($('last-round'), { 'display': 'none' });
        dojo.style($('game-scoring'), {'display': 'block'});
        
        let currentTime = 0;
        const lines = ['location', 'lord', 'affiliated', 'monster'];
        if (this.gamedatas.krakenExpansion) {
            lines.push('nebulis', 'kraken');
        }
        lines.push('total');
        console.log(breakdowns);
        lines.forEach(stage => {
            let breakdownStage = stage + '_points';
            if (stage == 'total') {
                breakdownStage = 'score';
            }
            // Set arrow to here
            setTimeout(this.setScoringArrowRow.bind(this, stage), currentTime);
            for( let player_id in this.gamedatas.players ) {
                setTimeout(this.setScoringRowText.bind(this, stage, player_id, breakdowns[player_id][breakdownStage]), currentTime);
                currentTime += 1000;
            }
        });
        
        // Set winner to be animated!
        currentTime -= 500;
        setTimeout(this.setScoringRowWinner.bind(this, winnerIds, lines), currentTime);
    }

    notif_useLord( notif: Notif<NotifUseLordArgs> ) {
        const lordCard = this.lordManager.getCardElement({ lord_id: notif.args.lord_id } as AbyssLord);
        lordCard.dataset.used = '1';
        lordCard.classList.remove('unused');
    }

    notif_refreshLords() {
        dojo.query(".lord").forEach(node => dojo.setAttr(node, "data-used", "0"));
    }

    notif_score( notif: Notif<NotifScoreArgs> ) {
        var score = notif.args.score;
        var player_id = notif.args.player_id;

        (this as any).scoreCtrl[player_id].toValue(score)
    }

    notif_control( notif: Notif<NotifControlArgs> ) {
        var location = notif.args.location;
        var lords = notif.args.lords;
        var player_id = notif.args.player_id;

        // Add the location to the player board
        this.getPlayerTable(player_id).addLocation(location, lords);
        
        this.lordManager.updateLordKeys(player_id);
        
        this.organisePanelMessages();
    }

    notif_loseLocation( notif: Notif<NotifLoseLocationArgs> ) {
        var location_id = notif.args.location_id;
        var player_id = notif.args.player_id;

        // Delete the location/lords
        dojo.query('.location.location-' + location_id).forEach(node => dojo.destroy(node));
        
        this.lordManager.updateLordKeys(player_id);
        
        this.organisePanelMessages();
    }

    notif_newLocations( notif: Notif<NotifNewLocationsArgs> ) {
        var locations = notif.args.locations;
        var deck_size = notif.args.deck_size;

        this.visibleLocations.addCards(locations, {
            fromElement: document.querySelector('.location.location-back'),
            originalSide: 'back',
        });
        this.organiseLocations();
        this.setDeckSize(dojo.query('#locations-holder .location-back'), deck_size);
    }

    notif_disable( notif: Notif<NotifDisableArgs> ) {
        var lord_id = notif.args.lord_id;
        dojo.query('.lord-' + lord_id).addClass('disabled');
        for( var player_id in this.gamedatas.players ) {
            this.lordManager.updateLordKeys(player_id);
        }
    }

    notif_allyDeckShuffle ( notif: Notif<NotifAllyDeckShuffleArgs> ) {
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
    }

    notif_lootReward( notif: Notif<NotifMonsterRewardArgs> ) {
        var player_id = notif.args.player_id;
        this.incPearlCount(player_id, +notif.args.pearls);
        $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + +notif.args.monsters;
        $('keycount_p' + player_id).innerHTML = +($('keycount_p' + player_id).innerHTML) + +notif.args.keys;
    }

    notif_monsterReward( notif: Notif<NotifMonsterRewardArgs>) {
        this.notif_lootReward(notif);
        this.notif_setThreat({args: {threat: 0}} as Notif<NotifThreatArgs>);
    }

    notif_monsterTokens( notif: Notif<NotifMonsterTokensArgs> )
    {
        var monsters = notif.args.monsters;

        var monster_hand = $('monster-hand_p' + (this as any).player_id);
        if (monster_hand) {
        dojo.style(monster_hand, "display", "block");
        for (var i in monsters) {
            dojo.place( '<i class="icon icon-monster-faceup icon-monster-'+ monsters[i].value +'">'+ monsters[i].value +'</i>', monster_hand );
        }
        }
    }
    
    notif_monsterHand( notif: Notif<NotifMonsterHandArgs> ) {
        var monsters = notif.args.monsters;
        var playerId = notif.args.player_id;

        var monster_hand = $('monster-hand_p' + playerId);
        if (monster_hand) {
            dojo.style(monster_hand, "display", "block");
            monster_hand.innerHTML = '';
            for (var i in monsters) {
                dojo.place( '<i class="icon icon-monster-faceup icon-monster-'+ monsters[i].value +'">'+ monsters[i].value +'</i>', monster_hand );
            }
        }
    }

    notif_plot( notif: Notif<NotifPlotArgs> ) {
        var lord = notif.args.lord;
        var player_id = notif.args.player_id;
        var deck_size = +notif.args.deck_size;
        var pearls = +notif.args.pearls;
        var old_lord = notif.args.old_lord;

        this.incPearlCount(player_id, -pearls);
        this.visibleLords.addCard(lord, {
            fromElement: document.querySelector('.lord.lord-back'),
            originalSide: 'back',
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);

        if (old_lord) {
        dojo.query('.lord-' + old_lord.lord_id).forEach(node => dojo.destroy(node));
        }
    }

    notif_affiliate( notif: Notif<NotifAffiliateArgs> ) {
        var ally = notif.args.ally;
        var player_id = notif.args.player_id;
        this.getPlayerTable(player_id).addAffiliated(ally);
        
        if (notif.args.also_discard) {
            // Also discard this ally from my hand!
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - 1;

            // If it's me, also delete the actual ally
            if (player_id == this.getPlayerId()) {
                this.getCurrentPlayerTable().removeHandAllies([ally]);
            }
            
        }
        
        this.organisePanelMessages();
    }

    notif_explore( notif: Notif<NotifExploreArgs> ) {
        var ally = notif.args.ally;
        this.visibleAllies.addCard(ally, {
            fromElement: document.getElementById('explore-track-deck'),
            originalSide: 'back',
        });

        // Update ally decksize
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        
        this.lastExploreTime = new Date().getTime();
    }
    
    notif_exploreTake( notif: Notif<NotifExploreTakeArgs> ) {
        // If this comes right after notif_explore, we want to delay by about 1-2 seconds
        let deltaTime = this.lastExploreTime ? (new Date().getTime() - this.lastExploreTime) : 1000;
        
        if (deltaTime < 2000) {
            let self = this;
            setTimeout(() => 
                self.notif_exploreTake_real( notif )
            , 2000 - deltaTime);
        } else {
            this.notif_exploreTake_real( notif );
        }
        
        this.organisePanelMessages();
    }

    notif_exploreTake_real( notif: Notif<NotifExploreTakeArgs> ) {
        let player_id = notif.args.player_id;
        var slot = notif.args.slot;

        // For each slot, animate to the council pile, fade out and destroy, then increase the council pile by 1
        var delay = 0;
        let self = this;
        const cards = this.visibleAllies.getCards();
        for (var i = 1; i <= 5; i++) {
            const ally = cards.find(ally => ally.place == i);
            if (ally) {
                const faction = ally.faction;
                if (faction === null) {
                    // Monster just fades out
                    this.visibleAllies.removeCard(ally);
                    delay += 200;
                } else if (i != slot && faction != 10) {
                    // Animate to the council!
                    this.councilStacks[faction].addCard(ally);
                    delay += 200;
                } else {
                    // This is the card that was taken - animate it to hand or player board
                    const theAlly = this.allyManager.getCardElement(ally);
                    if (player_id == this.getPlayerId()) {
                        setTimeout(() => {
                            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, theAlly);
                            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
                        }, delay);
                        delay += 200;
                    } else {
                        dojo.setStyle(theAlly, "zIndex", "1");
                        dojo.setStyle(theAlly, "transition", "none");
                        var animation = (this as any).slideToObject( theAlly, $('player_board_' + player_id), 600, delay );
                        animation.onEnd = () => {
                            dojo.destroy(theAlly);
                            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
                        };
                        animation.play();
                        delay += 200;
                    }
                }
            }
        }
        
        this.organisePanelMessages();
    }

    notif_takeAllyFromDiscard( notif: Notif<NotifPurchaseArgs> ) {
        let player_id = notif.args.player_id;

        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, $('game-extra'));

        }
        $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
        
        this.organisePanelMessages();
    }

    notif_purchase( notif: Notif<NotifPurchaseArgs> ) {
        let player_id = notif.args.player_id;

        // Update handsize and pearls of purchasing player
        this.incPearlCount(player_id, -notif.args.incPearls);
        this.incPearlCount(notif.args.first_player_id, notif.args.incPearls);
        if (this.gamedatas.krakenExpansion) {
            this.incNebulisCount(player_id, -notif.args.incNebulis);
            this.incNebulisCount(notif.args.first_player_id, notif.args.incNebulis);
        }

        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally);
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
        } else {
            const theAlly = this.allyManager.getCardElement(notif.args.ally);
            dojo.setStyle(theAlly, "zIndex", "1");
            dojo.setStyle(theAlly, "transition", "none");
            var animation = (this as any).slideToObject( theAlly, $('player_board_' + player_id), 600 );
            animation.onEnd = () => {
                dojo.destroy(theAlly);
                $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
            };
            animation.play();
        }
        
        this.organisePanelMessages();
    }

    notif_setThreat( notif: Notif<NotifThreatArgs> ) {
        // Update handsize and pearls of purchasing player
        var tt = $('threat-token');
        dojo.removeClass(tt, 'slot-0 slot-1 slot-2 slot-3 slot-4 slot-5');
        dojo.addClass(tt, 'slot-' + notif.args.threat);
    }

    notif_discardCouncil( notif: Notif<NotifDiscardCouncilArgs> ) {
        var faction = notif.args.faction;

        // Empty the council pile
        var deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);
    }

    notif_requestSupport( notif: Notif<NotifRequestSupportArgs> ) {
        let player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var num = notif.args.num;
        let deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);

        // Add cards to the player's hand
        if (player_id != this.getPlayerId()) {
        for (var i = 0; i < num; i++) {
            var anim = (this as any).slideTemporaryObject( this.allyManager.renderBack(), 'council-track', 'council-track-' + faction, $('player_board_' + player_id), 600, i * 200 );
            dojo.connect(anim, 'onEnd', () => {
                $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
            });
        }
        } else {
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + num;
        }
        
        this.organisePanelMessages();
    }

    notif_requestSupportCards( notif: Notif<NotifRequestSupportCardsArgs> ) {
        let player_id = notif.args.player_id;
        var faction = notif.args.faction;
        let allies = notif.args.allies;

        // Add cards to the player's hand
        var delay = 0;
        const ROTATIONS = [-25, -10, 0, 13, 28];
        allies.forEach(ally => {
            setTimeout(() => {
                this.getPlayerTable(Number(player_id)).addHandAlly(ally, document.getElementById('council-track-' + faction), 'back', ROTATIONS[faction]);
                this.organisePanelMessages();
            }, delay);
            delay += 250;
        });
    }

    notif_moveLordsRight(notif: Notif<any>) {
        this.visibleLords.addCards(notif.args.lords);
    }

    notif_recruit( notif: Notif<NotifRecruitArgs> ) {
        var lord = notif.args.lord;
        var player_id = +notif.args.player_id;
        var spent_lords = notif.args.spent_lords;
        var spent_allies = notif.args.spent_allies;

        // Spend pearls and allies
        if (spent_allies) {
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - spent_allies.length;
        }
        if (notif.args.incPearls) {
            this.incPearlCount(player_id, -notif.args.incPearls);
        }
        if (this.gamedatas.krakenExpansion && notif.args.incNebulis) {
            this.incNebulisCount(player_id, -notif.args.incNebulis);
        }

        // If it's me, then actually get rid of the allies
        if (spent_allies && player_id == this.getPlayerId()) {
            this.getCurrentPlayerTable().removeHandAllies(spent_allies);
        }

        if (spent_lords) {
            this.getPlayerTable(player_id).removeLords(spent_lords);
        }

        // Add the lord
        if (lord) {
            this.getPlayerTable(player_id).addLord(lord);
        }
        
        this.lordManager.updateLordKeys(player_id);
        this.organisePanelMessages();
    }

    notif_refillLords(notif: Notif<NotifRefillLordsArgs>) {
        var lords = notif.args.lords;
        var deck_size = notif.args.deck_size;
        this.visibleLords.addCards(lords, {
            fromElement: document.querySelector('.lord.lord-back'),
            originalSide: 'back',
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
    }

    notif_diff( notif: Notif<NotifDiffArgs> ) {
        var player_id = +notif.args.player_id;
        var source = notif.args.source;
        var source_player_id = null;
        if (source.startsWith("player_")) {
        source_player_id = +source.slice("player_".length);
        }
        // TODO : Animate based on 'source'
        // If source starts "lord_" animate to the lord
        if (notif.args.pearls) {
            this.incPearlCount(player_id, notif.args.pearls);
        }
        if (notif.args.nebulis) {
            this.incNebulisCount(player_id, notif.args.nebulis);
        }

        if (notif.args.keys) {
            var keys = notif.args.keys;
            $('keycount_p' + player_id).innerHTML = +($('keycount_p' + player_id).innerHTML) + +keys;
            }

            if (notif.args.allies_lost) {
            var allies = notif.args.allies_lost;
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - +allies.length;

            // If it's me, also delete the actual ally
            if (notif.args.player_id == this.getPlayerId()) {
                this.getCurrentPlayerTable().removeHandAllies(allies);
            }
        }

        if (notif.args.monster) {
            $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + notif.args.monster.length;
            if (source_player_id) {
                $('monstercount_p' + source_player_id).innerHTML = +($('monstercount_p' + source_player_id).innerHTML) - notif.args.monster.length;
                if (source_player_id == (this as any).player_id) {
                    // Remove it from me
                    var monster_hand = $('monster-hand_p' + (this as any).player_id);
                    if (monster_hand) {
                    for (var i in notif.args.monster) {
                        var tokens = dojo.query(".icon-monster-" + notif.args.monster[i].value, monster_hand);
                        if (tokens.length > 0) {
                            dojo.destroy(tokens[0]);
                        }
                    }
                    }
                }
            }
            if (player_id == (this as any).player_id) {
                // Add it to me
                var monster_hand = $('monster-hand_p' + (this as any).player_id);
                if (monster_hand) {
                    dojo.style(monster_hand, "display", "block");
                    for (var i in notif.args.monster) {
                        dojo.place( '<i class="icon icon-monster-faceup icon-monster-'+ notif.args.monster[i].value +'">'+ notif.args.monster[i].value +'</i>', monster_hand );
                    }
                }
            }
        }

        if (notif.args.monster_count) {
        $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + +notif.args.monster_count;
        if (source_player_id) {
            $('monstercount_p' + source_player_id).innerHTML = +($('monstercount_p' + source_player_id).innerHTML) - +notif.args.monster_count;
        }
        }
        
        this.organisePanelMessages();
    }

    notif_payMartialLaw(notif: Notif<NotifPayMartialLawArgs>) {
        this.incPearlCount(notif.args.playerId, -notif.args.spentPearls);
    }

    notif_newLoot(notif: Notif<NotifNewLootArgs>) {
        this.locationManager.addLoot(notif.args.locationId, notif.args.newLoot);
    }

    notif_highlightLootsToDiscard(notif: Notif<NotifDiscardLootsArgs>) {
        this.locationManager.highlightLootsToDiscard(notif.args.locationId, notif.args.loots);
    }

    notif_discardLoots(notif: Notif<NotifDiscardLootsArgs>) {
        this.locationManager.discardLoots(notif.args.locationId, notif.args.loots);
    }

    notif_searchSanctuaryAlly(notif: Notif<NotifSearchSanctuaryAllyArgs>) {
        this.getPlayerTable(notif.args.playerId).addHandAlly(notif.args.ally, document.getElementById('explore-track-deck'));

        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
    }

    notif_kraken(notif: Notif<any>) {
        this.placeKrakenToken(notif.args.playerId);
    }

    notif_placeSentinel(notif: Notif<NotifPlaceSentinelArgs>) {
        this.placeSentinelToken(notif.args.playerId, notif.args.lordId, notif.args.location, notif.args.locationArg);
    }

    notif_placeKraken(notif: Notif<NotifPlaceKrakenArgs>) {
        this.councilStacks[notif.args.faction].addCard(notif.args.ally);

        var deck = dojo.query('#council-track .slot-' + notif.args.faction);
        this.setDeckSize(deck, notif.args.deckSize);
    }

}