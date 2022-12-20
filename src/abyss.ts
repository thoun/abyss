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
    public locationManager: LocationManager;

    private gamedatas: AbyssGamedatas;
    private playersTables: PlayerTable[] = [];
    private useZoom: boolean;
    private zoomLevel: number;
    private lastExploreTime: number;

    constructor() {
    }

    setup(gamedatas: AbyssGamedatas) {
        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.allyManager = new AllyManager(this);
        this.lordManager = new LordManager(this);
        this.locationManager = new LocationManager(this);

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
            this.locationManager.organise();
        }, 200));
        
        // Setting up player boards
        this.createPlayerPanels(gamedatas);
        
        // Add an extra column at the end, just for padding reasons
        $('scoring-row-players').innerHTML += `<td></td>`;
        
        $('scoring-row-location').innerHTML += `<td></td>`;
        $('scoring-row-lord').innerHTML += `<td></td>`;
        $('scoring-row-affiliated').innerHTML += `<td></td>`;
        $('scoring-row-monster').innerHTML += `<td></td>`;
        
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
        for ( var i in gamedatas.lord_slots ) {
            let node = this.lordManager.placeWithTooltip( gamedatas.lord_slots[i], $('lords-track') );
        }

        // Allies
        for ( var i in gamedatas.ally_explore_slots ) {
            var ally = gamedatas.ally_explore_slots[i];
            if (ally.faction == null) ally.faction = 'monster';
            this.allyManager.placeWithTooltip(ally, $('explore-track'));
        }
        for ( var i in gamedatas.ally_council_slots ) {
            var num = gamedatas.ally_council_slots[i];
            var deck = dojo.query('#council-track .slot-' + i);
            this.setDeckSize(deck, num);
        }
        this.setDeckSize(dojo.query('#lords-track .slot-0'), gamedatas.lord_deck);
        this.setDeckSize(dojo.query('#explore-track .slot-0'), gamedatas.ally_deck);

        // Threat level
        var threat_token = $('threat-token');
        dojo.removeClass(threat_token, "slot-0 slot-1 slot-2 slot-3 slot-4 slot-5");
        dojo.addClass(threat_token, "slot-" + gamedatas.threat_level);

        // Locations
        for ( var i in gamedatas.location_available ) {
            var location = gamedatas.location_available[i];
            this.locationManager.placeWithTooltip(location, $('locations-holder'));
        }
        this.setDeckSize(dojo.query('#locations-holder .location-back'), gamedatas.location_deck);

        // Clickers
        dojo.connect($('explore-track'), 'onclick', this, 'onClickExploreTrack');
        dojo.connect($('council-track'), 'onclick', this, 'onClickCouncilTrack');
        dojo.connect($('lords-track'), 'onclick', this, 'onClickLordsTrack');
        dojo.connect($('player-hand'), 'onclick', this, 'onClickPlayerHand');
        (this as any).addEventToClass('icon-monster', 'onclick', 'onClickMonsterIcon');
        (this as any).addEventToClass('free-lords', 'onclick', 'onClickPlayerFreeLords');
        dojo.connect($('locations-holder'), 'onclick', this, 'onClickLocation');
        dojo.connect($('locations-holder-overflow'), 'onclick', this, 'onClickLocation');
        (this as any).addEventToClass('locations', 'onclick', 'onClickLocation');

        // Tooltips
        // Hide this one, because it doesn't line up due to Zoom
        //(this as any).addTooltip( 'explore-track-deck', '', _('Explore'), 1 );
        (this as any).addTooltipToClass( 'pearl-holder', _( 'Pearls' ), '' );
        // TODO GBA (this as any).addTooltipToClass( 'nebulis-holder', _( 'Nebulis' ), '' );
        (this as any).addTooltipToClass( 'key-holder', _( 'Key tokens (+ Keys from free Lords)' ), '' );
        (this as any).addTooltipToClass( 'ally-holder', _( 'Ally cards in hand' ), '' );
        (this as any).addTooltipToClass( 'monster-holder', _( 'Monster tokens' ), '' );
        (this as any).addTooltipToClass( 'lordcount-holder', _( 'Number of Lords' ), '' );
        
        (this as any).addTooltip( 'scoring-location-icon', _( 'Locations' ), '' );
        (this as any).addTooltip( 'scoring-lords-icon', _( 'Lords' ), '' );
        (this as any).addTooltip( 'scoring-affiliated-icon', _( 'Affiliated Allies' ), '' );
        (this as any).addTooltip( 'scoring-monster-tokens-icon', _( 'Monster tokens' ), '' );
        
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
        log('onEnteringState', stateName, args);

        // Remove all current move indicators
        dojo.query('.card-current-move').removeClass('card-current-move');
        if ((this as any).isCurrentPlayerActive()) {
            if( (this as any).checkPossibleActions( 'explore' ) ) {
                dojo.query('#explore-track-deck').addClass('card-current-move');
            }
            if( (this as any).checkPossibleActions( 'exploreTake' ) || (this as any).checkPossibleActions( 'purchase' ) ) {
                for (var i = 5; i >= 1; i--) {
                var qr = dojo.query('#explore-track .slot-' + i);
                if (qr.length > 0) {
                    qr.addClass('card-current-move');
                    break;
                }
                }
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
                this.onEnterinLord7();
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
        }
    }

    private onEnteringRecruitPay(args: EnteringRecruitPayArgs) {
        // highlight the given lord
        dojo.query("#lords-track .lord[data-lord-id=" + args.lord_id + "]").addClass("selected");

        if ((this as any).isCurrentPlayerActive()) {
            var lord = dojo.query("#lords-track .lord.selected")[0];
            var cost = +args.cost;
            $('button_recruit').innerHTML = _('Recruit') + ' ('+cost+' <i class="icon icon-pearl"></i>)';
            dojo.setAttr($('button_recruit'), "data-base-cost", cost);
        }
    }

    private onEnterinLord7() {
        // Put a red border around the player monster tokens (who aren't me)
        if ((this as any).isCurrentPlayerActive()) {
            for( var player_id in this.gamedatas.players ) {
                if (player_id != (this as any).player_id) {
                    dojo.query("#cp_board_p" + player_id + " .icon.icon-monster").addClass("clickable");
                }
            }
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
            for( var iLocation in args._private.locations ) {
                var location = args._private.locations[iLocation];
                var location_element = this.locationManager.placeWithTooltip(location, $('game-extra'));
                dojo.addClass(location_element, 'card-current-move');
                dojo.connect(location_element, 'onclick', this, 'onClickLocation');
            }
            dojo.style($('game-extra'), "display", "block");
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
        }
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
                    var cost = args.cost;
                    (this as any).addActionButton( 'button_purchase', _('Purchase') + ` (${cost} <i class="icon icon-pearl"></i>)`, 'onPurchase' );
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
                    (this as any).addActionButton( 'button_recruit', _('Recruit'), 'onRecruit' );
                    (this as any).addActionButton( 'button_pass', _('Cancel'), 'onPass' );
                    break;
                case 'affiliate':
                    for (var i in args.allies) {
                        var ally = args.allies[i];
                        var r: string = ally.value + ' ' + this.allyManager.allyNameText(ally);
                        var btnId = 'button_affiliate_' + ally.ally_id;
                        (this as any).addActionButton( btnId, r, 'onChooseAffiliate' );
                        dojo.addClass($(btnId), 'affiliate-button')
                    }
                    break;
                case 'plotAtCourt':
                    (this as any).addActionButton( 'button_plot', _('Plot') + ` (1 <i class="icon icon-pearl"></i>)`, 'onPlot' );
                    (this as any).addActionButton( 'button_pass', _('Pass'), 'onPass' );
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
                        (this as any).addActionButton( 'button_discard', _('Discard selected allies'), () => this.onDiscard() );

                        var ally_ids = [];
                        dojo.query("#player-hand .ally.selected").forEach(node => 
                            ally_ids.push(+dojo.attr(node, 'data-ally-id'))
                        );
                        if (!ally_ids.length) {
                            document.getElementById('button_discard').classList.add('disabled');
                        }

                        (this as any).addActionButton( 'button_payMartialLaw', _('Pay') + ` ${martialLawArgs.diff} <i class="icon icon-pearl"></i>`, () => this.payMartialLaw());
                        if (!martialLawArgs.canPay) {
                            document.getElementById('button_payMartialLaw').classList.add('disabled');
                        }
                    }
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
            
            $('scoring-row-total').innerHTML += `<td id="scoring-row-total-p${playerId}"></td>`;
        });
    }

    private incPearlCount(playerId: number, inc: number) {
        $('pearlcount_p' + playerId).innerHTML = +($('pearlcount_p' + playerId).innerHTML) + inc;
    }
    private incNebulisCount(playerId: number, inc: number) {
        $('nebuliscount_p' + playerId).innerHTML = +($('nebuliscount_p' + playerId).innerHTML) + inc;
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
        if(!(this as any).checkAction( 'discard' )) {
        return;
        }

        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(node => 
            ally_ids.push(+dojo.attr(node, 'data-ally-id'))
        );

        (this as any).ajaxcall( "/abyss/abyss/discard.html", { lock: true, ally_ids: ally_ids.join(';') }, this,
        () => {},
        () => {}
        );
    }

    onRecruit() {
        if(!(this as any).checkAction( 'pay' )) {
        return;
        }

        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(node => {
            ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });

        (this as any).ajaxcall( "/abyss/abyss/pay.html", { lock: true, ally_ids: ally_ids.join(';') }, this,
        () => {},
        () => {}
        );
    }

    onChooseAffiliate(evt) {
        if(!(this as any).checkAction( 'affiliate' )) {
        return;
        }

        var ally_id = +evt.currentTarget.id.replace('button_affiliate_', '');

        (this as any).ajaxcall( "/abyss/abyss/affiliate.html", { lock: true, ally_id: ally_id }, this,
        () => {},
        () => {}
        );
    }

    onClickCouncilTrack(evt) {
        if (dojo.hasClass(evt.target, 'ally')) {
        // Draw this stack??
        dojo.stopEvent( evt );

        var faction = dojo.attr(evt.target, 'data-faction');

        if( ! (this as any).checkAction( 'requestSupport' ) ) {
            return;
        }

        (this as any).ajaxcall( "/abyss/abyss/requestSupport.html", { lock: true, faction: faction }, this,
        () => {},
        () => {}
        );
        }
    }

    onClickLocation ( evt ) {
        var locations = dojo.query(evt.target).closest('.location');
        if (locations.length > 0) {
        var target = locations[0];
        if (dojo.hasClass(target, 'location') && ! dojo.hasClass(target, 'location-back')) {
            dojo.stopEvent( evt );

            let location_id = dojo.attr(target, 'data-location-id');

            if( ! (this as any).checkAction( 'chooseLocation' ) ) {
            return;
            }
            
            // If you select Black Smokers with an empty deck, warn!
            if (location_id == 10) {
                let location_deck = dojo.query('.location.location-back')[0];
                let location_deck_size = +dojo.attr(location_deck, 'data-size');
                if (location_deck_size == 0) {
                (this as any).confirmationDialog( _('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch( this, function() {
                    var lord_ids = [];
                    dojo.query("#player-panel-" + (this as any).player_id + " .free-lords .lord.selected").forEach((node) => {
                    lord_ids.push(+dojo.attr(node, 'data-lord-id'));
                    });
    
                    (this as any).ajaxcall( "/abyss/abyss/chooseLocation.html", { lock: true, location_id: location_id, lord_ids: lord_ids.join(';') }, this,
                    () => {},
                    () => {}
                    );
                    } ) );
                    return;
                }
            }
            
            var lord_ids = [];
            dojo.query("#player-panel-" + (this as any).player_id + " .free-lords .lord.selected").forEach(function (node) {
            lord_ids.push(+dojo.attr(node, 'data-lord-id'));
            });

            (this as any).ajaxcall( "/abyss/abyss/chooseLocation.html", { lock: true, location_id: location_id, lord_ids: lord_ids.join(';') }, this,
            () => {},
            () => {}
            );
        }
        }
    }

    onClickLordsTrack( evt ) {
        if (dojo.hasClass(evt.target, 'lord') && ! dojo.hasClass(evt.target, 'lord-back')) {
        // Draw this stack??
        dojo.stopEvent( evt );

        var lord_id = dojo.attr(evt.target, 'data-lord-id');

        if( ! (this as any).checkAction( 'recruit' ) ) {
            return;
        }

        (this as any).ajaxcall( "/abyss/abyss/recruit.html", { lock: true, lord_id: lord_id }, this,
        () => {},
        () => {}
        );
        }
    }

    onClickExploreTrack( evt ) {
        if (dojo.hasClass(evt.target, 'slot-0')) {
        this.onClickExploreDeck( evt );
        } else if (dojo.hasClass(evt.target, 'ally')) {
        this.onClickExploreCard( evt );
        }
    }

    onClickExploreDeck( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'explore' ) ) {
        return;
        }

        (this as any).ajaxcall( "/abyss/abyss/explore.html", { lock: true }, this,
        () => {},
        () => {}
        );
    }

    onClickExploreCard( evt ) {
        dojo.stopEvent( evt );
        
        if( (this as any).checkAction( 'purchase', true ) ) {
            this.onPurchase( evt );
            return;
        }

        if( ! (this as any).checkAction( 'exploreTake' ) ) {
        return;
        }

        var slot = 0;
        if (dojo.hasClass(evt.target, 'slot-1')) {
        slot = 1;
        } else if (dojo.hasClass(evt.target, 'slot-2')) {
        slot = 2;
        } else if (dojo.hasClass(evt.target, 'slot-3')) {
        slot = 3;
        } else if (dojo.hasClass(evt.target, 'slot-4')) {
        slot = 4;
        } else if (dojo.hasClass(evt.target, 'slot-5')) {
        slot = 5;
        }

        (this as any).ajaxcall( "/abyss/abyss/exploreTake.html", { lock: true, slot: slot }, this,
        () => {},
        () => {}
        );
    }

    onPurchase( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'purchase' ) ) {
        return;
        }

        (this as any).ajaxcall( "/abyss/abyss/purchase.html", { lock: true }, this,
        () => {},
        () => {}
        );
    }

    onPass( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'pass' ) ) {
        return;
        }

        (this as any).ajaxcall( "/abyss/abyss/pass.html", { lock: true }, this,
        () => {},
        () => {}
        );
    }

    onPlot( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'plot' ) ) {
        return;
        }

        (this as any).ajaxcall( "/abyss/abyss/plot.html", { lock: true }, this,
        () => {},
        () => {}
        );
    }

    onChooseMonsterReward( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'chooseReward' ) ) {
        return;
        }

        var option = +evt.currentTarget.id.replace("button_reward_", '');

        (this as any).ajaxcall( "/abyss/abyss/chooseReward.html", { lock: true, option: option }, this,
        () => {},
        () => {}
        );
    }

    onClickPlayerHand( evt ) {
        if (dojo.hasClass(evt.target, 'ally')) {
        if( (this as any).checkAction( 'pay', true ) ) {
            dojo.stopEvent( evt );

            dojo.toggleClass(evt.target, 'selected');

            var lord = dojo.query("#lords-track .lord.selected")[0];
            var cost = +dojo.attr($('button_recruit'), 'data-base-cost');
            var diversity = +dojo.attr(lord, 'data-diversity');

            // Value selected
            var value = 0;
            dojo.query("#player-hand .ally.selected").forEach(node => {
                value += +dojo.attr(node, 'data-value');
            });
            var shortfall = cost - value;
            if (shortfall < 0) { shortfall = 0; }

            // Update "Recruit" button
            $('button_recruit').innerHTML = _('Recruit') + ' ('+shortfall+' <i class="icon icon-pearl"></i>)';
        } else if( (this as any).checkAction( 'discard', true ) ) {
            dojo.stopEvent( evt );

            // Multi-discard: select, otherwise just discard this one
            dojo.toggleClass(evt.target, 'selected');

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
            dojo.stopEvent( evt );

            var ally_id = dojo.attr(evt.target, 'data-ally-id');
            (this as any).ajaxcall( "/abyss/abyss/selectAlly.html", { lock: true, ally_id: ally_id }, this,
            () => {},
            () => {}
            );
        }
        }
    }

    onClickMonsterIcon( evt ) {
        if (dojo.hasClass(evt.target, 'clickable')) {
        if( (this as any).checkAction( 'chooseMonsterTokens', true ) ) {
            dojo.stopEvent( evt );

            // Discard this card...
            var player_id: Number = dojo.attr(dojo.query(evt.target).closest('.cp_board')[0], 'data-player-id');
            (this as any).ajaxcall( "/abyss/abyss/chooseMonsterTokens.html", { lock: true, player_id: player_id }, this,
            () => {},
            () => {}
            );
        }
        } else {
            if( (this as any).checkAction( 'chooseMonsterTokens' ) ) {
            dojo.stopEvent( evt );

            // Discard this card...
            var player_id: Number = +evt.target.id.replace("button_steal_monster_token_", "");
            (this as any).ajaxcall( "/abyss/abyss/chooseMonsterTokens.html", { lock: true, player_id: player_id }, this,
            () => {},
            () => {}
            );
            }
        }
    }

    onClickPlayerFreeLords( evt ) {
        if (dojo.hasClass(evt.target, 'lord')) {
        if( (this as any).checkAction( 'selectLord', true ) ) {
            dojo.stopEvent( evt );

            var lord_id = dojo.attr(evt.target, "data-lord-id");

            (this as any).ajaxcall( "/abyss/abyss/selectLord.html", { lock: true, lord_id: lord_id }, this,
            () => {},
            () => {}
            );
        } else if( (this as any).checkAction( 'lordEffect', true ) ) {
            dojo.stopEvent( evt );

            var lord_id = dojo.attr(evt.target, "data-lord-id");

            (this as any).ajaxcall( "/abyss/abyss/lordEffect.html", { lock: true, lord_id: lord_id }, this,
            () => {},
            () => {}
            );
        } else if( (this as any).checkAction( 'chooseLocation', true ) ) {
            dojo.stopEvent( evt );

            // Only allow this on your own Lords
            var panel = dojo.query(evt.target).closest('.player-panel')[0];
            if (panel.id == "player-panel-" + (this as any).player_id) {
            dojo.toggleClass(evt.target, "selected");
            }
        }
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
        (this as any).ajaxcall( "/abyss/abyss/setAutopass.html", { autopass }, this,
        () => {},
        () => {}
    );
    }

    onDrawLocation( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'drawLocations' ) ) {
        return;
        }

        var num = +evt.currentTarget.id.replace('button_draw_', '');

        (this as any).ajaxcall( "/abyss/abyss/drawLocations.html", { lock: true, num: num }, this,
        () => {},
        () => {}
        );
    }

    payMartialLaw() {
        if(!(this as any).checkAction('payMartialLaw')) {
            return;
        }

        this.takeAction('payMartialLaw');
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
            ['purchase', 1],
            ['exploreTake', 1000],
            ['setThreat', 1],
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
    
    setScoringRowWinner(winner_ids: string[]) {
        for (let i in winner_ids) {
            let player_id = winner_ids[i];
            dojo.addClass($('scoring-row-name-p' + player_id), 'wavetext');
            
            let stages = ['location', 'lord', 'affiliated', 'monster', 'total'];
            for (let j in stages) {
                let stage = stages[j];
                dojo.style($('scoring-row-'+stage+'-p' + player_id), {'backgroundColor': 'rgba(255, 215, 0, 0.3)'});
            }
        }
    }
    
    notif_finalRound( notif ) {
        let playerId = notif.args.player_id;
        
        this.gamedatas.game_ending_player = playerId;
        dojo.style($('last-round'), { 'display': 'block' });
    }
    
    notif_endGame_scoring ( notif: Notif<NotifEndGameScoringArgs> )
    {
        let breakdowns = notif.args.breakdowns;
        let winnerIds = notif.args.winner_ids;
        
        // Don't show the "final round" message if at the actual end
        dojo.style($('last-round'), { 'display': 'none' });
        dojo.style($('game-scoring'), {'display': 'block'});
        
        let stages = ['location', 'lord', 'affiliated', 'monster', 'total'];
        let currentTime = 0;
        for (let i in stages) {
            let stage = stages[i];
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
        }
        
        // Set winner to be animated!
        currentTime -= 500;
        setTimeout(this.setScoringRowWinner.bind(this, winnerIds), currentTime);
    }

    notif_useLord( notif: Notif<NotifUseLordArgs> ) {
        dojo.query(".lord.lord-" + notif.args.lord_id).forEach(node => {
            dojo.setAttr(node, "data-used", "1");
        });
    }

    notif_refreshLords() {
        dojo.query(".lord").forEach(node => {
            dojo.setAttr(node, "data-used", "0");
        });
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

        // Delete the location/lords
        dojo.query('.location.location-' + location.location_id).forEach(node => dojo.destroy(node));
        for (var i in lords) {
            var lord = lords[i];
            dojo.query('.lord.lord-' + lord.lord_id).forEach(node => dojo.destroy(node));
        }

        // Add the location to the player board
        var locations_holder = dojo.query('#player-panel-' + player_id + ' .locations')[0];
        var added_location = this.locationManager.placeWithTooltip(location, locations_holder);
        this.locationManager.organisePlayerBoard(player_id);

        // Add the lords to the location
        for (var i in lords) {
            var lord = lords[i];
            this.lordManager.placeWithTooltip( lord, dojo.query('.trapped-lords-holder', added_location)[0] );
        }
        
        this.lordManager.updateLordKeys(player_id);
        
        this.organisePanelMessages();
    }

    notif_loseLocation( notif: Notif<NotifLoseLocationArgs> ) {
        var location_id = notif.args.location_id;
        var player_id = notif.args.player_id;

        // Delete the location/lords
        dojo.query('.location.location-' + location_id).forEach(function (node) {
        dojo.destroy(node);
        });
        
        this.lordManager.updateLordKeys(player_id);
        
        this.organisePanelMessages();
    }

    notif_newLocations( notif: Notif<NotifNewLocationsArgs> ) {
        var locations = notif.args.locations;
        var deck_size = notif.args.deck_size;

        for (var i in locations) {
            var location = locations[i];
            this.locationManager.placeWithTooltip( location, $('locations-holder') );
        }

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

    notif_monsterReward( notif: Notif<NotifMonsterRewardArgs> ) {
        var player_id = notif.args.player_id;
        this.incPearlCount(player_id, +notif.args.pearls);
        $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + +notif.args.monsters;
        $('keycount_p' + player_id).innerHTML = +($('keycount_p' + player_id).innerHTML) + +notif.args.keys;
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
        let node = this.lordManager.placeWithTooltip( lord, $('lords-track') );
        dojo.setStyle(node, "left", "13px");
        requestAnimationFrame(() => {
        dojo.setStyle(node, "left", "");
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);

        if (old_lord) {
        dojo.query('.lord-' + old_lord.lord_id).forEach(node => dojo.destroy(node));
        }
    }

    notif_affiliate( notif: Notif<NotifAffiliateArgs> ) {
        var ally = notif.args.ally;
        var player_id = notif.args.player_id;
        this.allyManager.addAffiliated(player_id, ally);
        
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
        if (ally.faction == null) {
            ally.faction = 'monster';
        }
        let node = this.allyManager.placeWithTooltip(ally, $('explore-track'));
        dojo.setStyle(node, "left", "9px");
        requestAnimationFrame(() => {
            dojo.setStyle(node, "left", "");
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
        for (var i = 1; i <= 5; i++) {
            var ally = dojo.query('#explore-track .slot-' + i);
            if (ally.length > 0) {
                let theAlly = ally[0];
                var faction = dojo.attr(theAlly, 'data-faction');
                dojo.setStyle(theAlly, "transition", "none");
                if (faction == 'monster') {
                    // Monster just fades out
                    (this as any).fadeOutAndDestroy( theAlly, 400, delay );
                    delay += 200;
                } else if (i != slot) {
                    // Animate to the council!
                    let deck = dojo.query('#council-track .slot-' + faction);
                    var animation = (this as any).slideToObject( theAlly, deck[0], 600, delay );
                    animation.onEnd = function() {
                        dojo.destroy(theAlly);
                        var num = +dojo.attr(deck[0], 'data-size') + 1;
                        self.setDeckSize(deck, num);
                    };
                    animation.play();
                    delay += 200;
                } else {
                    // This is the card that was taken - animate it to hand or player board
                    if (player_id == this.getPlayerId()) {
                        dojo.setStyle(theAlly, "zIndex", "1");
                        dojo.setStyle(theAlly, "transition", "none");
                        setTimeout(() => {
                            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, theAlly);
                            dojo.destroy(theAlly);
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

    notif_purchase( notif: Notif<NotifPurchaseArgs> ) {
        let player_id = notif.args.player_id;
        let theAlly = dojo.query('#explore-track .slot-' + notif.args.slot)[0];

        // Update handsize and pearls of purchasing player
        this.incPearlCount(player_id, -notif.args.cost);
        this.incPearlCount(notif.args.first_player_id, notif.args.cost);

        if (player_id == (this as any).player_id) {
            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, theAlly);
            dojo.destroy(theAlly);
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
        } else {
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
        var player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var num = notif.args.num;

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
        if (player_id != (this as any).player_id) {
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
        for (var j in allies) {
            let ally = allies[j];
            setTimeout(() => 
                this.getPlayerTable(Number(player_id)).addHandAlly(ally, document.getElementById('council-track-' + faction)),
                delay
            );
            delay += 200;
        }
        
        this.organisePanelMessages();
    }

    notif_moveLordsRight() {
        // Shuffle everything right
        var num = dojo.query("#lords-track .lord").length - 1;
        for (var i = 6; i >= 1; i--) {
        // Go back from here, and move the first lord we find into this slot
        for (var j = i; j >= 1; j--) {
            var potential = dojo.query("#lords-track .lord.slot-" + j);
            if (potential.length > 0) {
                dojo.removeClass(potential[0], 'slot-' + j);
                dojo.addClass(potential[0], 'slot-' + i);
                break;
                }
            }
        }
    }

    notif_recruit( notif: Notif<NotifRecruitArgs> ) {
        var lord = notif.args.lord;
        var player_id = +notif.args.player_id;
        var spent_pearls = +notif.args.spent_pearls;
        var spent_lords = notif.args.spent_lords;
        var spent_allies = notif.args.spent_allies;

        // Remove lord from the track
        if (lord) {
        dojo.query("#lords-track .lord[data-lord-id=" + lord.lord_id + "]").forEach(node => dojo.destroy(node));
        }

        // Spend pearls and allies
        if (spent_allies) {
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - spent_allies.length;
        }
        if (spent_pearls) {
            this.incPearlCount(player_id, -spent_pearls);
        }

        // If it's me, then actually get rid of the allies
        if (spent_allies && player_id == this.getPlayerId()) {
            this.getCurrentPlayerTable().removeHandAllies(spent_allies);
        }

        if (spent_lords) {
            for (var i in spent_lords) {
                var lord2 = spent_lords[i];
                dojo.query('#player-panel-'+player_id+' .lord[data-lord-id='+lord2.lord_id+']').forEach(node => dojo.destroy(node));
            }
        }

        // Add the lord
        if (lord) {
            this.lordManager.placeWithTooltip( lord, dojo.query('#player-panel-'+player_id+' .free-lords')[0] );
        }
        
        this.lordManager.updateLordKeys(player_id);
        this.organisePanelMessages();
    }

    notif_refillLords( notif: Notif<NotifRefillLordsArgs> ) {
        var lords = notif.args.lords;
        var player_id = +notif.args.player_id;
        var deck_size = notif.args.deck_size;
        for (var i in lords) {
            var lord = lords[i];
            if (dojo.query("#lords-track .lord[data-lord-id=" + lord.lord_id + "]").length == 0) {
                let node = this.lordManager.placeWithTooltip( lord, $('lords-track') );
                dojo.setStyle(node, "left", "13px");
                requestAnimationFrame(() => {
                    dojo.setStyle(node, "left", "");
                });
            }
        }
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
}