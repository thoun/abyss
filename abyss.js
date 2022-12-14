var Ally = {
    uniqueId: 0,
    render: function (ally) {
        Ally.uniqueId++;
        return "<div id=\"ally-uid-".concat(Ally.uniqueId, "\" data-ally-id=\"").concat(ally.ally_id, "\" data-faction=\"").concat(ally.faction, "\" data-value=\"").concat(ally.value, "\" class=\"ally ally-").concat(ally.faction, "-").concat(ally.value, " ").concat(ally.place >= 0 ? ('slot-' + ally.place) : '', "\"></div>");
    },
    placeWithTooltip: function (ally, parent) {
        var node = dojo.place(Ally.render(ally), parent);
        Tooltip.connect(node, Ally.renderTooltip(ally), "ally");
        return node;
    },
    allyNameText: function (ally) {
        // 1 Crab, coloured
        var allies = [
            '<span style="color: purple">' + _('Jellyfish') + '</span>',
            '<span style="color: red">' + _('Crab') + '</span>',
            '<span style="color: #999900">' + _('Seahorse') + '</span>',
            '<span style="color: green">' + _('Shellfish') + '</span>',
            '<span style="color: blue">' + _('Squid') + '</span>'
        ];
        return allies[+ally.faction];
    },
    renderTooltip: function (ally) {
        if (ally.faction >= 0) {
            var allies = [
                '<span style="color: purple">' + _('Jellyfish') + '</span>',
                '<span style="color: red">' + _('Crab') + '</span>',
                '<span style="color: #999900">' + _('Seahorse') + '</span>',
                '<span style="color: green">' + _('Shellfish') + '</span>',
                '<span style="color: blue">' + _('Squid') + '</span>'
            ];
            return "<div class=\"abs-tooltip-ally\">\n        ".concat(Ally.allyNameText(ally), "\n        <br>\n        <span style=\"font-size: smaller\"><b>").concat(_("Value"), ": </b> ").concat(_(ally.value), "</span>\n      </div>");
        }
        else {
            return "<div class=\"abs-tooltip-ally\">\n        ".concat(_("Monster"), "\n      </div>");
        }
    },
    renderBack: function () {
        return "<div class=\"ally ally-black\" style=\"z-index: 1\"></div>";
    },
    factionIcon: function (f) {
        // TODO : Actual icon?
        if (f == 0) {
            return 'Purple';
        }
        else if (f == 1) {
            return 'Red';
        }
        else if (f == 2) {
            return 'Yellow';
        }
        else if (f == 3) {
            return 'Green';
        }
        else if (f == 4) {
            return 'Blue';
        }
    },
    placeAffiliated: function (allies, panel) {
        var parent = dojo.query('div.affiliated', panel)[0];
        var result = "";
        for (var faction = 0; faction < 5; faction++) {
            var alliesFragment = "";
            var factionHolder = dojo.create("div");
            factionHolder.className = "affiliated-faction";
            factionHolder.setAttribute("data-faction", faction);
            for (var j in allies) {
                var ally = allies[j];
                if (ally.faction == faction) {
                    alliesFragment = Ally.render(ally) + alliesFragment;
                    var newNode = dojo.place(Ally.render(ally), factionHolder, "first");
                    Tooltip.connect(newNode, Ally.renderTooltip(ally), "ally");
                }
            }
            dojo.place(factionHolder, parent);
        }
        return parent;
    },
    addHand: function (player_id, ally) {
        var node = $('player-hand');
        var refNode = node;
        var pos = 'last';
        // Put it before the first ally which is bigger
        for (var i = 0; i < node.childNodes.length; i++) {
            var n = node.childNodes[i];
            var value = dojo.attr(n, 'data-ally-id');
            if (+value > +ally.ally_id) {
                refNode = n;
                pos = 'before';
                break;
            }
        }
        var newNode = dojo.place(Ally.render(ally), refNode, pos);
        Tooltip.connect(newNode, Ally.renderTooltip(ally), "ally");
        gameui.organisePanelMessages();
        return newNode;
    },
    addAffiliated: function (player_id, ally) {
        var node = dojo.query('#player-panel-' + player_id + ' .affiliated-faction[data-faction=' + ally.faction + ']')[0];
        var refNode = node;
        var pos = 'last';
        // Put it before the first ally which is bigger
        for (var i = 0; i < node.childNodes.length; i++) {
            var n = node.childNodes[i];
            var value = dojo.attr(n, 'data-value');
            if (+value > +ally.value) {
                refNode = n;
                pos = 'before';
                break;
            }
        }
        var newNode = dojo.place(Ally.render(ally), refNode, pos);
        Tooltip.connect(newNode, Ally.renderTooltip(ally), "ally");
        return newNode;
    }
};
var Lord = {
    uniqueId: 0,
    // TODO : Names need to move outside of PHP and into js for i18n
    render: function (lord) {
        Lord.uniqueId++;
        return "<div id=\"lord-uid-".concat(Lord.uniqueId, "\" class=\"lord lord-").concat(lord.lord_id, " slot-").concat(lord.place, " transition-position ").concat((lord.turned == 1) ? 'disabled' : '', "\" data-lord-id=\"").concat(lord.lord_id, "\" data-cost=\"").concat(lord.cost, "\" data-diversity=\"").concat(lord.diversity, "\" data-used=\"").concat(lord.used, "\" data-turned=\"").concat(lord.turned, "\" data-effect=\"").concat(lord.effect, "\" data-keys=\"").concat(lord.keys, "\">\n      <span class=\"lord-desc\"><span class=\"lord-name\">").concat(_(lord.name), "</span>").concat(_(lord.desc), "</span>\n    </div>");
    },
    renderTooltip: function (lord) {
        var descSection = "";
        if (lord.desc != "") {
            descSection = '<hr>';
            if (lord.effect == 1) {
                descSection += '<b>' + _('When recruited') + ':</b> ';
            }
            descSection += _(lord.desc);
        }
        var guilds = [
            '<span style="color: purple">' + _('Mage') + '</span>',
            '<span style="color: red">' + _('Soldier') + '</span>',
            '<span style="color: #999900">' + _('Farmer') + '</span>',
            '<span style="color: green">' + _('Merchant') + '</span>',
            '<span style="color: blue">' + _('Politician') + '</span>',
            '<span style="color: gray">' + _('Ambassador') + '</span>'
        ];
        var factionSection = "";
        if (lord.faction != null) {
            factionSection = '<span style="font-size: smaller">' + guilds[lord.faction] + "</span><br>";
        }
        else {
            factionSection = '<span style="font-size: smaller">' + guilds[guilds.length - 1] + "</span><br>";
        }
        var diversitySection = "";
        for (var i = 0; i < lord.diversity; i++) {
            var colour = "#666";
            if (i == 0 && lord.faction != null) {
                if (lord.faction == 0) {
                    colour = "purple";
                }
                else if (lord.faction == 1) {
                    colour = "red";
                }
                else if (lord.faction == 2) {
                    colour = "#999900";
                }
                else if (lord.faction == 3) {
                    colour = "green";
                }
                else if (lord.faction == 4) {
                    colour = "blue";
                }
            }
            diversitySection += "<div style=\"display: inline-block; margin-right: 2px; width: 10px; height: 10px; border-radius: 5px; background-color: ".concat(colour, ";\"></div>");
        }
        var keysString = "";
        for (var i = 0; i < lord.keys; i++) {
            keysString += ' <i class="icon icon-key"></i>';
        }
        var costString = _('Cost');
        var costNumber = lord.cost;
        var trueCost = costNumber;
        // Only show true costs for lords in the row
        // I have the Treasurer (25) : cost - 2
        if (dojo.query('#player-panel-' + gameui.player_id + ' .free-lords .lord-25:not(.disabled)').length > 0) {
            trueCost -= 2;
        }
        // I don't have the protector (14) ...
        if (dojo.query('#player-panel-' + gameui.player_id + ' .free-lords .lord-14:not(.disabled)').length == 0) {
            // Another player has the Recruiter (1) : cost + 2
            if (dojo.query('.player-panel:not(#player-panel-' + gameui.player_id + ') .free-lords .lord-1:not(.disabled)').length > 0) {
                trueCost = +trueCost + 2;
            }
        }
        if (+trueCost < 0)
            trueCost = 0;
        if (+trueCost != +costNumber) {
            costNumber = "<del>".concat(costNumber, "</del> ").concat(trueCost);
        }
        return "<div class=\"abs-tooltip-lord\">\n      <span style=\"float: right\">".concat(_(lord.points), " <i class=\"fa fa-star\"></i>").concat(keysString, "</span>\n      <h3 style=\"padding-right: 60px;\">").concat(_(lord.name), "</h3>\n      ").concat(factionSection, "\n      <span style=\"font-size: smaller\"><b>").concat(costString, ": </b> ").concat(costNumber, " ").concat(diversitySection, "</span>\n      ").concat(descSection, "\n    </div>");
    },
    placeWithTooltip: function (lord, parent) {
        var node = dojo.place(Lord.render(lord), parent);
        Tooltip.connect(node, Lord.renderTooltip.bind(this, lord), "lord");
        return node;
    },
    updateLordKeys: function (playerId) {
        var playerPanel = $('player-panel-' + playerId);
        var lords = dojo.query('.free-lords .lord', playerPanel);
        var keys = 0;
        var numLords = dojo.query('.lord', playerPanel).length;
        for (var i = 0; i < lords.length; i++) {
            var lord = lords[i];
            if (!dojo.hasClass(lord, "disabled")) {
                keys += +lord.getAttribute("data-keys");
            }
        }
        $('lordkeycount_p' + playerId).innerHTML = keys;
        $('lordcount_p' + playerId).innerHTML = numLords;
    }
};
var Location = {
    uniqueId: 0,
    makeDesc: function (location, laurel) {
        var pointsReplacement = laurel ? '<i class="icon icon-laurel"></i>' : ' <i class="fa fa-star"></i>';
        // TODO : Wrap points in nobr to avoid line breaks
        var desc = dojo.replace(_(location.desc).replace(/\$/g, pointsReplacement), {
            farmer: '<span style="background-color: rgba(0,0,0,0.7); color: #999900">' + _('Farmer') + '</span>',
            soldier: '<span style="background-color: rgba(0,0,0,0.7); color: red">' + _('Soldier') + '</span>',
            merchant: '<span style="background-color: rgba(0,0,0,0.7); color: green">' + _('Merchant') + '</span>',
            politician: '<span style="background-color: rgba(255,255,255,0.7); color: blue">' + _('Politician') + '</span>',
            mage: '<span style="background-color: rgba(255,255,255,0.7); color: purple">' + _('Mage') + '</span>',
            seahorse: '<span style="background-color: rgba(0,0,0,0.7); color: #999900">' + _('Seahorse') + '</span>',
            crab: '<span style="background-color: rgba(0,0,0,0.7); color: red">' + _('Crab') + '</span>',
            shellfish: '<span style="background-color: rgba(0,0,0,0.7); color: green">' + _('Shellfish') + '</span>',
            squid: '<span style="background-color: rgba(255,255,255,0.7); color: blue">' + _('Squid') + '</span>',
            jellyfish: '<span style="background-color: rgba(255,255,255,0.7); color: purple">' + _('Jellyfish') + '</span>',
        });
        return desc;
    },
    render: function (location) {
        Location.uniqueId++;
        var desc = Location.makeDesc(location, true);
        return "<div id=\"location-uid-".concat(Location.uniqueId, "\" class=\"location board location-").concat(location.location_id, "\" data-location-id=\"").concat(location.location_id, "\">\n      <div class=\"location-clicker\"></div>\n      <span class=\"location-name\">").concat(_(location.name), "</span>\n      <span class=\"location-desc\">").concat(desc, "</span>\n      <div class=\"trapped-lords-holder\"></div>\n    </div>");
    },
    placeLords: function (locationNode, lords) {
        for (var i in lords) {
            var lord = lords[i];
            var parent_1 = dojo.query('.trapped-lords-holder', locationNode)[0];
            Lord.placeWithTooltip(lord, parent_1);
        }
    },
    organisePlayerBoard: function (player_id) {
        // playerboard .locations:
        //     pairs go into .locations-row (padding-top: 50px)
        //     two locations (note, locations no longer have the padding top!)
        var locations = [];
        dojo.query('#player-panel-' + player_id + ' .locations .location').forEach(function (node) {
            locations.push(node);
            node.parentNode.removeChild(node);
        });
        dojo.query('#player-panel-' + player_id + ' .locations .locations-row').forEach(function (node) {
            dojo.destroy(node);
        });
        var locations_holder = dojo.query('#player-panel-' + player_id + ' .locations')[0];
        var num_rows = Math.ceil(locations.length / 2);
        for (var i = 0; i < num_rows; i++) {
            var row = dojo.place('<div class="locations-row"></div>', locations_holder);
            dojo.place(locations.shift(), row);
            if (locations.length > 0)
                dojo.place(locations.shift(), row);
        }
    },
    renderTooltip: function (location) {
        var desc = Location.makeDesc(location);
        return "<div class=\"abs-tooltip-location\">\n      <h3 style=\"padding-right: 50px;\">".concat(_(location.name), "</h3>\n      <hr>\n      ").concat(desc, "\n    </div>");
    },
    placeWithTooltip: function (location, parent) {
        var node = dojo.place(Location.render(location), parent);
        Tooltip.connect(node, Location.renderTooltip(location), "location");
        if (parent && parent.id == 'locations-holder') {
            Location.organise();
        }
        return node;
    },
    organise: function () {
        // First, move all in overflow back to holder
        var overflowLocations = dojo.query('.location:not(.location-back)', $('locations-holder-overflow'));
        for (var i = 0; i < overflowLocations.length; i++) {
            $('locations-holder').appendChild(overflowLocations[i]);
        }
        // If on playmat:
        if (dojo.hasClass($('game-board-holder'), "playmat")) {
            // Then, move all beyond 5 into the overflow
            var locations = dojo.query('.location:not(.location-back)', $('locations-holder'));
            if (locations.length > 5) {
                for (var i = 5; i < locations.length; i++) {
                    // move to overflow...
                    $('locations-holder-overflow').appendChild(locations[i]);
                }
            }
        }
    },
};
var Tooltip = {
    connect: function (node, html, offsetType) {
        var tt = $('abs-tooltip-0');
        dojo.connect(node, "onmouseenter", function () {
            if (gameui.prefs[200].value == 1) {
                return;
            }
            var r = node.getBoundingClientRect();
            var outer = $('game-holder').getBoundingClientRect();
            var left = r.left - outer.left;
            var top = r.top - outer.top;
            var zoomSupported = gameui.useZoom;
            // Always include content zoom
            var contentZoom = zoomSupported ? (+dojo.style($('page-content'), 'zoom') || 1) : 1;
            var totalZoom = contentZoom;
            // Only include game zoom if the node is in the zoomed element
            var gameZoom = 1;
            if (zoomSupported && dojo.hasClass($('game-board-holder'), "playmat") && $('game-board-holder').contains(node)) {
                gameZoom = gameui.zoomLevel;
            }
            if (dojo.hasClass($('game-board-holder'), "playmat") && $('locations-holder-holder').contains(node)) {
                gameZoom *= zoomSupported ? (dojo.style($('locations-holder-holder'), 'zoom') || 1) : 1;
            }
            totalZoom *= gameZoom;
            top *= totalZoom;
            left *= totalZoom;
            if (typeof html === 'function') {
                tt.innerHTML = html.call(this);
            }
            else {
                tt.innerHTML = html;
            }
            // If there is room above, put it there...
            var offsetX = 0;
            var offsetY = 0;
            if (offsetType === "lord") {
                offsetX = 44 * gameZoom;
                offsetY = 68 * gameZoom;
            }
            else if (offsetType === "ally") {
                offsetX = 29 * gameZoom;
                offsetY = 43 * gameZoom;
            }
            var padding = 20;
            var positions = ["right", "top", "bottom", "left"];
            var originalTop = top;
            var originalLeft = left;
            for (var i in positions) {
                top = originalTop;
                left = originalLeft;
                var position = positions[i];
                if (position == "right") {
                    left += node.offsetWidth * totalZoom + padding;
                    left += offsetX;
                    top -= offsetY;
                }
                else if (position == "top") {
                    top -= tt.offsetHeight * contentZoom + padding;
                    left -= offsetX;
                    top -= offsetY;
                }
                else if (position == "bottom") {
                    top += node.offsetHeight * totalZoom + padding;
                    left -= offsetX;
                    top += offsetY;
                }
                else if (position == "left") {
                    left -= tt.offsetWidth * contentZoom + padding;
                    left -= offsetX;
                    top -= offsetY;
                }
                // If it fits, stop here
                var right = left + tt.offsetWidth * contentZoom;
                var bottom = top + tt.offsetHeight * contentZoom;
                if (right > $('page-content').offsetWidth) {
                    continue;
                }
                if (left < 0) {
                    continue;
                }
                var scrollLimit = window.scrollY - $('page-content').offsetTop;
                if (top < scrollLimit) {
                    continue;
                }
                break;
            }
            dojo.style(tt, { 'opacity': '1', 'top': top + 'px', 'left': left + 'px' });
        });
        dojo.connect(node, "onmouseleave", function () {
            dojo.style(tt, { 'opacity': '0' });
        });
    }
};
var debounce;
var Abyss = /** @class */ (function () {
    function Abyss() {
    }
    Abyss.prototype.setup = function (gamedatas) {
        this.gamedatas = gamedatas;
        // Use zoom when not on FF
        this.useZoom = false; //navigator.userAgent.toLowerCase().indexOf('firefox') <= -1;
        var self = this;
        dojo.connect($('modified-layout-checkbox'), 'onchange', function () {
            if ($('modified-layout-checkbox').checked) {
                dojo.addClass($('game-board-holder'), "playmat");
            }
            else {
                dojo.removeClass($('game-board-holder'), "playmat");
            }
        });
        // On resize, fit cards to screen (debounced)
        if (self.prefs[100].value == 1) {
            dojo.addClass($('game-board-holder'), "playmat");
        }
        dojo.connect(window, "onresize", debounce(function () {
            var r = $('game-holder').getBoundingClientRect();
            var w = r.width;
            var zoom = 1;
            if (self.prefs[100].value == 1) {
                if (w > 1000) {
                    zoom = w / 1340;
                    dojo.addClass($('game-board-holder'), "playmat");
                    dojo.removeClass($('game-board-holder'), "playmat-narrow");
                }
                else {
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
            }
            else {
                var height = zoom == 1 ? "" : ((639 * zoom) + "px");
                dojo.style($('game-board-holder'), {
                    transform: "scale(" + zoom + ")",
                    height: height
                });
            }
            Location.organise();
        }, 200));
        // Setting up player boards
        for (var player_id in gamedatas.players) {
            var player = gamedatas.players[player_id];
            // Setting up players boards if needed
            var player_board_div = $('player_board_' + player_id);
            dojo.place(this.format_block('jstpl_player_board', player), player_board_div);
            // Set up scoring table in advance (helpful for testing!)
            var splitPlayerName = '';
            var chars = player.name.split("");
            for (var i_1 in chars) {
                splitPlayerName += "<span>".concat(chars[i_1], "</span>");
            }
            $('scoring-row-players').innerHTML += "<td><span id=\"scoring-row-name-p".concat(player_id, "\" style=\"color:#").concat(player.color, ";\"><span>").concat(splitPlayerName, "</span></span></td>");
            $('scoring-row-location').innerHTML += "<td id=\"scoring-row-location-p".concat(player_id, "\"></td>");
            $('scoring-row-lord').innerHTML += "<td id=\"scoring-row-lord-p".concat(player_id, "\"></td>");
            $('scoring-row-affiliated').innerHTML += "<td id=\"scoring-row-affiliated-p".concat(player_id, "\"></td>");
            $('scoring-row-monster').innerHTML += "<td id=\"scoring-row-monster-p".concat(player_id, "\"></td>");
            $('scoring-row-total').innerHTML += "<td id=\"scoring-row-total-p".concat(player_id, "\"></td>");
        }
        // Add an extra column at the end, just for padding reasons
        $('scoring-row-players').innerHTML += "<td></td>";
        $('scoring-row-location').innerHTML += "<td></td>";
        $('scoring-row-lord').innerHTML += "<td></td>";
        $('scoring-row-affiliated').innerHTML += "<td></td>";
        $('scoring-row-monster').innerHTML += "<td></td>";
        $('scoring-row-total').innerHTML += "<td></td>";
        var p = this.player_id;
        if (this.isSpectator) {
            p = gamedatas.playerorder[0];
        }
        var players_done = {};
        do {
            if (players_done[p])
                break;
            players_done[p] = 1;
            var player = gamedatas.players[p];
            var template = "<div id=\"player-panel-".concat(p, "\" class=\"player-panel whiteblock\">\n            <h3>").concat(player.name, "</h3>\n            ").concat(p == this.player_id ? "<div id=\"player-hand\" class=\"hand\"><i id=\"no-hand-msg\">".concat(_("No Allies in hand"), "</i></div>") : '', "\n            <h4>").concat(_("Affiliated Allies"), "</h4>\n            <i id=\"no-affiliated-msg-p").concat(p, "\">").concat(_("No Affiliated Allies"), "</i>\n            <div class=\"affiliated\"></div>\n            <h4>").concat(_("Lords"), "</h4>\n            <i id=\"no-lords-msg-p").concat(p, "\">").concat(_("No Lords"), "</i>\n            <div class=\"free-lords\"></div>\n            <div class=\"locations\"></div>\n            </div>");
            var playerPanel = dojo.place(template, $('player-panel-holder'));
            // Add a whiteblock for the player
            if (p == this.player_id) {
                // Add player hand
                for (var j in player.hand) {
                    var node = Ally.placeWithTooltip(player.hand[j], $('player-hand'));
                }
                var handTitle = _("Hand");
                // <h4>${handTitle}</h4>
            }
            // Add player affiliated
            Ally.placeAffiliated(player.affiliated, playerPanel);
            // Add locations
            var locationsHolder = dojo.query("#player-panel-".concat(p, " .locations"))[0];
            for (var j in player.locations) {
                var location = player.locations[j];
                var locations_holder = dojo.query('#player-panel-' + player_id + ' .locations')[0];
                var lords = [];
                for (var k in player.lords) {
                    var lord = player.lords[k];
                    if (+lord.location == +location.location_id) {
                        lords.push(lord);
                    }
                }
                var locationNode = Location.placeWithTooltip(location, locationsHolder);
                Location.placeLords(locationNode, lords);
            }
            var freeLordHolder = dojo.query("#player-panel-".concat(p, " .free-lords"))[0];
            for (var j in player.lords) {
                var lord = player.lords[j];
                if (lord.location == null) {
                    Lord.placeWithTooltip(lord, freeLordHolder);
                }
            }
            Lord.updateLordKeys(p);
            Location.organisePlayerBoard(p);
            p = gamedatas.turn_order[p];
        } while (p != this.player_id);
        // Monsters
        for (var player_id in gamedatas.players) {
            var monster_hand = $('monster-hand_p' + player_id);
            if (monster_hand) {
                var player = gamedatas.players[player_id];
                if (player.monsters && Object.keys(player.monsters).length > 0) {
                    dojo.style(monster_hand, "display", "block");
                    for (var i in player.monsters) {
                        dojo.place('<i class="icon icon-monster-faceup icon-monster-' + player.monsters[i].value + '">' + player.monsters[i].value + '</i>', monster_hand);
                    }
                }
            }
        }
        // Lords
        for (var i in gamedatas.lord_slots) {
            var node = Lord.placeWithTooltip(gamedatas.lord_slots[i], $('lords-track'));
        }
        // Allies
        for (var i in gamedatas.ally_explore_slots) {
            var ally = gamedatas.ally_explore_slots[i];
            if (ally.faction == null)
                ally.faction = 'monster';
            Ally.placeWithTooltip(ally, $('explore-track'));
        }
        for (var i in gamedatas.ally_council_slots) {
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
        for (var i in gamedatas.location_available) {
            var location = gamedatas.location_available[i];
            Location.placeWithTooltip(location, $('locations-holder'));
        }
        this.setDeckSize(dojo.query('#locations-holder .location-back'), gamedatas.location_deck);
        // Clickers
        dojo.connect($('explore-track'), 'onclick', this, 'onClickExploreTrack');
        dojo.connect($('council-track'), 'onclick', this, 'onClickCouncilTrack');
        dojo.connect($('lords-track'), 'onclick', this, 'onClickLordsTrack');
        dojo.connect($('player-hand'), 'onclick', this, 'onClickPlayerHand');
        this.addEventToClass('icon-monster', 'onclick', 'onClickMonsterIcon');
        this.addEventToClass('free-lords', 'onclick', 'onClickPlayerFreeLords');
        dojo.connect($('locations-holder'), 'onclick', this, 'onClickLocation');
        dojo.connect($('locations-holder-overflow'), 'onclick', this, 'onClickLocation');
        this.addEventToClass('locations', 'onclick', 'onClickLocation');
        // Tooltips
        // Hide this one, because it doesn't line up due to Zoom
        //(this as any).addTooltip( 'explore-track-deck', '', _('Explore'), 1 );
        this.addTooltipToClass('pearl-holder', _('Pearls'), '');
        this.addTooltipToClass('key-holder', _('Key tokens (+ Keys from free Lords)'), '');
        this.addTooltipToClass('ally-holder', _('Ally cards in hand'), '');
        this.addTooltipToClass('monster-holder', _('Monster tokens'), '');
        this.addTooltipToClass('lordcount-holder', _('Number of Lords'), '');
        this.addTooltip('scoring-location-icon', _('Locations'), '');
        this.addTooltip('scoring-lords-icon', _('Lords'), '');
        this.addTooltip('scoring-affiliated-icon', _('Affiliated Allies'), '');
        this.addTooltip('scoring-monster-tokens-icon', _('Monster tokens'), '');
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
        if (!this.isSpectator) {
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
        var me = gamedatas.players[this.player_id];
        if (me) {
            if (!me.autopass) {
                me.autopass = "0;0;0;0;0";
            }
            if (me.autopass) {
                var pieces = me.autopass.split(";");
                if (pieces.length > 5) {
                    pieces = [0, 0, 0, 0, 0];
                }
                if (pieces.length >= 5) {
                    var firstValue = +pieces[0];
                    var allSame = true;
                    for (var i_2 = 0; i_2 < 5; i_2++) {
                        var max = +pieces[i_2];
                        if (max != firstValue) {
                            allSame = false;
                        }
                        for (var j_1 = 0; j_1 <= max; j_1++) {
                            $('autopass-' + i_2 + '-' + j_1).checked = true;
                        }
                    }
                    if (allSame) {
                        $('autopass-all-' + firstValue).checked = true;
                    }
                }
            }
            var _loop_1 = function (faction) {
                var _loop_3 = function (i_3) {
                    dojo.connect($('autopass-' + faction + '-' + i_3), 'onclick', function () {
                        // Check only up to this
                        for (var j_2 = 0; j_2 <= 5; j_2++) {
                            $('autopass-all-' + j_2).checked = false;
                            $('autopass-' + faction + '-' + j_2).checked = j_2 <= i_3;
                        }
                        self.onUpdateAutopass();
                    });
                };
                for (var i_3 = 0; i_3 <= 5; i_3++) {
                    _loop_3(i_3);
                }
            };
            for (var faction = 0; faction < 5; faction++) {
                _loop_1(faction);
            }
            var _loop_2 = function (i_4) {
                dojo.connect($('autopass-all-' + i_4), 'onclick', function () {
                    // Check only this one
                    for (var j_3 = 0; j_3 <= 5; j_3++) {
                        $('autopass-all-' + j_3).checked = i_4 == j_3;
                    }
                    for (var faction = 0; faction < 5; faction++) {
                        for (var j_4 = 0; j_4 <= 5; j_4++) {
                            $('autopass-' + faction + '-' + j_4).checked = j_4 <= i_4;
                        }
                    }
                    self.onUpdateAutopass();
                });
            };
            for (var i_4 = 0; i_4 <= 5; i_4++) {
                _loop_2(i_4);
            }
        }
        this.organisePanelMessages();
        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();
    };
    Abyss.prototype.organisePanelMessages = function () {
        // For each player, show/hide message based on if there are allies about
        for (var i in this.gamedatas.players) {
            var player = this.gamedatas.players[i];
            // Do they have any Lords?
            var lords = dojo.query('.lord', $('player-panel-' + i));
            $('no-lords-msg-p' + i).style.display = lords.length > 0 ? 'none' : 'block';
            // Affiliated?
            var affiliated = dojo.query('.affiliated .ally', $('player-panel-' + i));
            $('no-affiliated-msg-p' + i).style.display = affiliated.length > 0 ? 'none' : 'block';
            if (i == this.player_id) {
                // Hand?
                var hand = dojo.query('.ally', $('player-hand'));
                $('no-hand-msg').style.display = hand.length > 0 ? 'none' : 'block';
            }
        }
    };
    Abyss.prototype.setDeckSize = function (deck, num) {
        deck.removeClass("deck-empty deck-low deck-medium deck-full");
        if (num == 0) {
            deck.addClass("deck-empty");
        }
        else if (num <= 2) {
            deck.addClass("deck-low");
        }
        else if (num <= 5) {
            deck.addClass("deck-medium");
        }
        else {
            deck.addClass("deck-full");
        }
        // Set deck-size data
        deck.attr("data-size", num);
        // If it's a council stack, then add tooltip
        for (var i = 0; i < deck.length; i++) {
            var node = deck[i];
            var deckSize = dojo.query('.deck-size', node);
            if (deckSize.length > 0) {
                var n = deckSize[0];
                n.innerHTML = num > 0 ? num : "";
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Abyss.prototype.onEnteringState = function (stateName, args) {
        // Remove all current move indicators
        dojo.query('.card-current-move').removeClass('card-current-move');
        if (this.isCurrentPlayerActive()) {
            if (this.checkPossibleActions('explore')) {
                dojo.query('#explore-track-deck').addClass('card-current-move');
            }
            if (this.checkPossibleActions('exploreTake') || this.checkPossibleActions('purchase')) {
                for (var i = 5; i >= 1; i--) {
                    var qr = dojo.query('#explore-track .slot-' + i);
                    if (qr.length > 0) {
                        qr.addClass('card-current-move');
                        break;
                    }
                }
            }
            if (this.checkPossibleActions('requestSupport')) {
                dojo.query('#council-track .ally-back').addClass('card-current-move');
            }
            if (this.checkPossibleActions('recruit')) {
                // If affordableLords given, then highlight only affordable lords
                if (args.args && args.args._private && args.args._private.affordableLords) {
                    var affordableLords = args.args._private.affordableLords;
                    for (var i_5 in affordableLords) {
                        var lordId = affordableLords[i_5].lord_id;
                        dojo.query('#lords-track .lord.lord-' + lordId).addClass('card-current-move');
                    }
                }
                else {
                    dojo.query('#lords-track .lord:not(.lord-back)').addClass('card-current-move');
                }
            }
            if (this.checkPossibleActions('chooseLocation') && stateName != 'locationEffectBlackSmokers') {
                dojo.query('#locations-holder .location:not(.location-back)').addClass('card-current-move');
                dojo.query('#locations-holder-overflow .location:not(.location-back)').addClass('card-current-move');
            }
        }
        switch (stateName) {
            case 'recruitPay':
                // highlight the given lord
                dojo.query("#lords-track .lord[data-lord-id=" + args.args.lord_id + "]").addClass("selected");
                if (this.isCurrentPlayerActive()) {
                    var lord = dojo.query("#lords-track .lord.selected")[0];
                    var cost = +args.args.cost;
                    $('button_recruit').innerHTML = _('Recruit') + ' (' + cost + ' <i class="icon icon-pearl"></i>)';
                    dojo.setAttr($('button_recruit'), "data-base-cost", cost);
                }
                break;
            case 'lord7':
                // Put a red border around the player monster tokens (who aren't me)
                if (this.isCurrentPlayerActive()) {
                    for (var player_id in this.gamedatas.players) {
                        if (player_id != this.player_id) {
                            dojo.query("#cp_board_p" + player_id + " .icon.icon-monster").addClass("clickable");
                        }
                    }
                }
                break;
            case 'controlPostDraw':
                // Fade out the locations you can't buy
                if (this.isCurrentPlayerActive()) {
                    dojo.query("#locations-holder .location:not(.location-back)").addClass("unavailable");
                    dojo.query("#locations-holder-overflow .location:not(.location-back)").addClass("unavailable");
                    for (var i in args.args.location_ids) {
                        var location_id = args.args.location_ids[i];
                        dojo.query("#locations-holder .location.location-" + location_id).removeClass("unavailable");
                        dojo.query("#locations-holder-overflow .location.location-" + location_id).removeClass("unavailable");
                    }
                }
            case 'control':
                dojo.query(".free-lords .lord").removeClass("selected");
                for (var i in args.args.default_lord_ids) {
                    var lord_id = args.args.default_lord_ids[i];
                    dojo.query("#player-panel-" + this.player_id + " .free-lords .lord.lord-" + lord_id).addClass("selected");
                }
                break;
            case 'locationEffectBlackSmokers':
                // Draw all the locations in a div at the top. Register to each an onclick to select it.
                if (this.isCurrentPlayerActive()) {
                    for (var i in args.args._private.locations) {
                        var location = args.args._private.locations[i];
                        var location_element = Location.placeWithTooltip(location, $('game-extra'));
                        dojo.addClass(location_element, 'card-current-move');
                        dojo.connect(location_element, 'onclick', this, 'onClickLocation');
                    }
                    dojo.style($('game-extra'), "display", "block");
                }
                break;
            case 'purchase':
            case 'explore':
            case 'explore2':
            case 'explore3':
                // Disable players who have passed
                this.enableAllPlayerPanels();
                for (var i in args.args.passed_players) {
                    this.disablePlayerPanel(args.args.passed_players[i]);
                }
                // Underline the first player
                var first_player = args.args.first_player;
                dojo.query('a', $('player_name_' + first_player)).style('text-decoration', 'underline');
                break;
            case 'dummmy':
                break;
        }
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Abyss.prototype.onLeavingState = function (stateName) {
        $('game-extra').innerHTML = '';
        dojo.style($('game-extra'), "display", "none");
        switch (stateName) {
            case 'recruitPay':
                dojo.query("#lords-track .lord").removeClass("selected");
                dojo.query("#player-hand .ally").removeClass("selected");
                break;
            case 'lord7':
                // Put a red border around the player monster tokens (who aren't me)
                dojo.query(".cp_board .icon.icon-monster").removeClass("clickable");
                break;
            case 'controlPostDraw':
            case 'control':
                dojo.query("#locations-holder .location").removeClass("unavailable");
                dojo.query("#locations-holder-overflow .location").removeClass("unavailable");
            case 'lord19':
            case 'lord19b':
                dojo.query(".free-lords .lord").removeClass("selected");
                break;
            case 'purchase':
            case 'explore':
            case 'explore2':
            case 'explore3':
                this.enableAllPlayerPanels();
                dojo.query('.player-name a').style('text-decoration', '');
                break;
            case 'dummmy':
                break;
        }
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Abyss.prototype.onUpdateActionButtons = function (stateName, args) {
        if (this.isCurrentPlayerActive() && ["plotAtCourt", "action", "secondStack", "explore", "explore2", "explore3", "chooseMonsterReward", "recruitPay", "affiliate", "cleanupDiscard", "controlPostDraw", "unusedLords"].includes(stateName)) {
            dojo.query("#player-panel-" + this.player_id + " .free-lords .lord").forEach(function (node) {
                // unused, and unturned...
                var used = +dojo.attr(node, "data-used");
                var turned = +dojo.attr(node, "data-turned");
                var effect = +dojo.attr(node, "data-effect");
                if (!used && !turned && effect == 3) {
                    dojo.addClass(node, "unused");
                }
            });
        }
        else {
            dojo.query(".lord").removeClass("unused");
        }
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'purchase':
                    var cost = args.cost;
                    this.addActionButton('button_purchase', _('Purchase') + " (".concat(cost, " <i class=\"icon icon-pearl\"></i>)"), 'onPurchase');
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'chooseMonsterReward':
                    for (var i in args.rewards) {
                        var r = args.rewards[i];
                        r = r.replace(/K/g, "<i class=\"icon icon-key\"></i>");
                        r = r.replace(/P/g, "<i class=\"icon icon-pearl\"></i>");
                        r = r.replace(/M/g, "<i class=\"icon icon-monster\"></i>");
                        this.addActionButton('button_reward_' + i, r, 'onChooseMonsterReward');
                    }
                    break;
                case 'recruitPay':
                    this.addActionButton('button_recruit', _('Recruit'), 'onRecruit');
                    this.addActionButton('button_pass', _('Cancel'), 'onPass');
                    break;
                case 'affiliate':
                    for (var i in args.allies) {
                        var ally = args.allies[i];
                        var r = ally.value + ' ' + Ally.allyNameText(ally);
                        var btnId = 'button_affiliate_' + ally.ally_id;
                        this.addActionButton(btnId, r, 'onChooseAffiliate');
                        dojo.addClass($(btnId), 'affiliate-button');
                    }
                    break;
                case 'plotAtCourt':
                    this.addActionButton('button_plot', _('Plot') + " (1 <i class=\"icon icon-pearl\"></i>)", 'onPlot');
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'lord23':
                case 'lord26':
                case 'locationEffectBlackSmokers':
                case 'lord19':
                case 'lord22':
                case 'lord19b':
                case 'unusedLords':
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'lord12':
                case 'lord17':
                case 'lord21':
                    this.addActionButton('button_pass', _('Cancel'), 'onPass');
                    break;
                case 'lord2':
                case 'lord5':
                case 'cleanupDiscard':
                case 'postpurchaseDiscard':
                    this.addActionButton('button_discard', _('Discard'), 'onDiscard');
                    break;
                case 'lord7':
                    // Put a red border around the player monster tokens (who aren't me)
                    for (var player_id in this.gamedatas.players) {
                        if (player_id != this.player_id) {
                            var num_tokens = +$('monstercount_p' + player_id).innerHTML;
                            if (num_tokens > 0) {
                                this.addActionButton('button_steal_monster_token_' + player_id, this.gamedatas.players[player_id].name, 'onClickMonsterIcon');
                            }
                        }
                    }
                    break;
                case 'control':
                    var s = _('Draw ${n}');
                    var location_deck = dojo.query('.location.location-back')[0];
                    var location_deck_size = +dojo.attr(location_deck, 'data-size');
                    for (var i_6 = 1; i_6 <= 4; i_6++) {
                        if (location_deck_size < i_6)
                            continue;
                        this.addActionButton('button_draw_' + i_6, dojo.string.substitute(s, { n: i_6 }), 'onDrawLocation');
                    }
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    /*

        Here, you can defines some utility methods that you can use everywhere in your javascript
        script.

    */
    ///////////////////////////////////////////////////
    //// Player's action
    /*

        Here, you are defining methods to handle player's action (ex: results of mouse click on
        game objects).

        Most of the time, these methods:
        _ check the action is possible at this game state.
        _ make a call to the game server

    */
    Abyss.prototype.onDiscard = function (evt) {
        if (!this.checkAction('discard')) {
            return;
        }
        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(function (node) {
            ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });
        this.ajaxcall("/abyss/abyss/discard.html", { lock: true, ally_ids: ally_ids.join(';') }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onRecruit = function (evt) {
        if (!this.checkAction('pay')) {
            return;
        }
        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(function (node) {
            ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });
        this.ajaxcall("/abyss/abyss/pay.html", { lock: true, ally_ids: ally_ids.join(';') }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onChooseAffiliate = function (evt) {
        if (!this.checkAction('affiliate')) {
            return;
        }
        var ally_id = +evt.currentTarget.id.replace('button_affiliate_', '');
        this.ajaxcall("/abyss/abyss/affiliate.html", { lock: true, ally_id: ally_id }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onClickCouncilTrack = function (evt) {
        if (dojo.hasClass(evt.target, 'ally')) {
            // Draw this stack??
            dojo.stopEvent(evt);
            var faction = dojo.attr(evt.target, 'data-faction');
            if (!this.checkAction('requestSupport')) {
                return;
            }
            this.ajaxcall("/abyss/abyss/requestSupport.html", { lock: true, faction: faction }, this, function (result) { }, function (is_error) { });
        }
    };
    Abyss.prototype.onClickLocation = function (evt) {
        var locations = dojo.query(evt.target).closest('.location');
        if (locations.length > 0) {
            var target = locations[0];
            if (dojo.hasClass(target, 'location') && !dojo.hasClass(target, 'location-back')) {
                dojo.stopEvent(evt);
                var location_id_1 = dojo.attr(target, 'data-location-id');
                if (!this.checkAction('chooseLocation')) {
                    return;
                }
                // If you select Black Smokers with an empty deck, warn!
                if (location_id_1 == 10) {
                    var location_deck = dojo.query('.location.location-back')[0];
                    var location_deck_size = +dojo.attr(location_deck, 'data-size');
                    if (location_deck_size == 0) {
                        this.confirmationDialog(_('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch(this, function () {
                            var lord_ids = [];
                            dojo.query("#player-panel-" + this.player_id + " .free-lords .lord.selected").forEach(function (node) {
                                lord_ids.push(+dojo.attr(node, 'data-lord-id'));
                            });
                            this.ajaxcall("/abyss/abyss/chooseLocation.html", { lock: true, location_id: location_id_1, lord_ids: lord_ids.join(';') }, this, function (result) { }, function (is_error) { });
                        }));
                        return;
                    }
                }
                var lord_ids = [];
                dojo.query("#player-panel-" + this.player_id + " .free-lords .lord.selected").forEach(function (node) {
                    lord_ids.push(+dojo.attr(node, 'data-lord-id'));
                });
                this.ajaxcall("/abyss/abyss/chooseLocation.html", { lock: true, location_id: location_id_1, lord_ids: lord_ids.join(';') }, this, function (result) { }, function (is_error) { });
            }
        }
    };
    Abyss.prototype.onClickLordsTrack = function (evt) {
        if (dojo.hasClass(evt.target, 'lord') && !dojo.hasClass(evt.target, 'lord-back')) {
            // Draw this stack??
            dojo.stopEvent(evt);
            var lord_id = dojo.attr(evt.target, 'data-lord-id');
            if (!this.checkAction('recruit')) {
                return;
            }
            this.ajaxcall("/abyss/abyss/recruit.html", { lock: true, lord_id: lord_id }, this, function (result) { }, function (is_error) { });
        }
    };
    Abyss.prototype.onClickExploreTrack = function (evt) {
        if (dojo.hasClass(evt.target, 'slot-0')) {
            this.onClickExploreDeck(evt);
        }
        else if (dojo.hasClass(evt.target, 'ally')) {
            this.onClickExploreCard(evt);
        }
    };
    Abyss.prototype.onClickExploreDeck = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('explore')) {
            return;
        }
        this.ajaxcall("/abyss/abyss/explore.html", { lock: true }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onClickExploreCard = function (evt) {
        dojo.stopEvent(evt);
        if (this.checkAction('purchase', true)) {
            this.onPurchase(evt);
            return;
        }
        if (!this.checkAction('exploreTake')) {
            return;
        }
        var slot = 0;
        if (dojo.hasClass(evt.target, 'slot-1')) {
            slot = 1;
        }
        else if (dojo.hasClass(evt.target, 'slot-2')) {
            slot = 2;
        }
        else if (dojo.hasClass(evt.target, 'slot-3')) {
            slot = 3;
        }
        else if (dojo.hasClass(evt.target, 'slot-4')) {
            slot = 4;
        }
        else if (dojo.hasClass(evt.target, 'slot-5')) {
            slot = 5;
        }
        this.ajaxcall("/abyss/abyss/exploreTake.html", { lock: true, slot: slot }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onPurchase = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('purchase')) {
            return;
        }
        this.ajaxcall("/abyss/abyss/purchase.html", { lock: true }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onPass = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('pass')) {
            return;
        }
        this.ajaxcall("/abyss/abyss/pass.html", { lock: true }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onPlot = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('plot')) {
            return;
        }
        this.ajaxcall("/abyss/abyss/plot.html", { lock: true }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onChooseMonsterReward = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('chooseReward')) {
            return;
        }
        var option = +evt.currentTarget.id.replace("button_reward_", '');
        this.ajaxcall("/abyss/abyss/chooseReward.html", { lock: true, option: option }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onClickPlayerHand = function (evt) {
        if (dojo.hasClass(evt.target, 'ally')) {
            if (this.checkAction('pay', true)) {
                dojo.stopEvent(evt);
                dojo.toggleClass(evt.target, 'selected');
                var lord = dojo.query("#lords-track .lord.selected")[0];
                var cost = +dojo.attr($('button_recruit'), 'data-base-cost');
                var diversity = +dojo.attr(lord, 'data-diversity');
                // Value selected
                var value = 0;
                dojo.query("#player-hand .ally.selected").forEach(function (node) {
                    value += +dojo.attr(node, 'data-value');
                });
                var shortfall = cost - value;
                if (shortfall < 0) {
                    shortfall = 0;
                }
                // Update "Recruit" button
                $('button_recruit').innerHTML = _('Recruit') + ' (' + shortfall + ' <i class="icon icon-pearl"></i>)';
            }
            else if (this.checkAction('discard', true)) {
                dojo.stopEvent(evt);
                // Multi-discard: select, otherwise just discard this one
                dojo.toggleClass(evt.target, 'selected');
                // Discard this card directly?
                // var ally_id = dojo.attr(evt.target, 'data-ally-id');
                // (this as any).ajaxcall( "/abyss/abyss/discard.html", { lock: true, ally_ids: ally_id }, this,
                //   function( result ) {},
                //   function( is_error) {}
                // );
            }
            else if (this.checkAction('selectAlly', true)) {
                dojo.stopEvent(evt);
                var ally_id = dojo.attr(evt.target, 'data-ally-id');
                this.ajaxcall("/abyss/abyss/selectAlly.html", { lock: true, ally_id: ally_id }, this, function (result) { }, function (is_error) { });
            }
        }
    };
    Abyss.prototype.onClickMonsterIcon = function (evt) {
        if (dojo.hasClass(evt.target, 'clickable')) {
            if (this.checkAction('chooseMonsterTokens', true)) {
                dojo.stopEvent(evt);
                // Discard this card...
                var player_id = dojo.attr(dojo.query(evt.target).closest('.cp_board')[0], 'data-player-id');
                this.ajaxcall("/abyss/abyss/chooseMonsterTokens.html", { lock: true, player_id: player_id }, this, function (result) { }, function (is_error) { });
            }
        }
        else {
            if (this.checkAction('chooseMonsterTokens')) {
                dojo.stopEvent(evt);
                // Discard this card...
                var player_id = +evt.target.id.replace("button_steal_monster_token_", "");
                this.ajaxcall("/abyss/abyss/chooseMonsterTokens.html", { lock: true, player_id: player_id }, this, function (result) { }, function (is_error) { });
            }
        }
    };
    Abyss.prototype.onClickPlayerFreeLords = function (evt) {
        if (dojo.hasClass(evt.target, 'lord')) {
            if (this.checkAction('selectLord', true)) {
                dojo.stopEvent(evt);
                var lord_id = dojo.attr(evt.target, "data-lord-id");
                this.ajaxcall("/abyss/abyss/selectLord.html", { lock: true, lord_id: lord_id }, this, function (result) { }, function (is_error) { });
            }
            else if (this.checkAction('lordEffect', true)) {
                dojo.stopEvent(evt);
                var lord_id = dojo.attr(evt.target, "data-lord-id");
                this.ajaxcall("/abyss/abyss/lordEffect.html", { lock: true, lord_id: lord_id }, this, function (result) { }, function (is_error) { });
            }
            else if (this.checkAction('chooseLocation', true)) {
                dojo.stopEvent(evt);
                // Only allow this on your own Lords
                var panel = dojo.query(evt.target).closest('.player-panel')[0];
                if (panel.id == "player-panel-" + this.player_id) {
                    dojo.toggleClass(evt.target, "selected");
                }
            }
        }
    };
    Abyss.prototype.onUpdateAutopass = function () {
        var autopass = "";
        for (var faction = 0; faction < 5; faction++) {
            var max = 0;
            for (var j = 0; j <= 5; j++) {
                if ($('autopass-' + faction + '-' + j).checked) {
                    max = j;
                }
                else {
                    break;
                }
            }
            if (autopass.length > 0) {
                autopass += ";";
            }
            autopass += "" + max;
        }
        this.ajaxcall("/abyss/abyss/setAutopass.html", { autopass: autopass }, this, function (result) { }, function (is_error) { });
    };
    Abyss.prototype.onDrawLocation = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('drawLocations')) {
            return;
        }
        var num = +evt.currentTarget.id.replace('button_draw_', '');
        this.ajaxcall("/abyss/abyss/drawLocations.html", { lock: true, num: num }, this, function (result) { }, function (is_error) { });
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your abyss.game.php file.

    */
    Abyss.prototype.setupNotifications = function () {
        // Example 1: standard notification handling
        dojo.subscribe('explore', this, "notif_explore");
        dojo.subscribe('purchase', this, "notif_purchase");
        dojo.subscribe('exploreTake', this, "notif_exploreTake");
        dojo.subscribe('setThreat', this, "notif_setThreat");
        dojo.subscribe('monsterReward', this, "notif_monsterReward");
        dojo.subscribe('monsterTokens', this, "notif_monsterTokens");
        dojo.subscribe('monsterHand', this, "notif_monsterHand");
        dojo.subscribe('discardCouncil', this, "notif_discardCouncil");
        dojo.subscribe('requestSupport', this, "notif_requestSupport");
        dojo.subscribe('requestSupportCards', this, "notif_requestSupportCards");
        dojo.subscribe('recruit', this, "notif_recruit");
        dojo.subscribe('refillLords', this, "notif_refillLords");
        dojo.subscribe('affiliate', this, "notif_affiliate");
        dojo.subscribe('plot', this, "notif_plot");
        dojo.subscribe('allyDeckShuffle', this, "notif_allyDeckShuffle");
        dojo.subscribe('diff', this, "notif_diff");
        dojo.subscribe('disable', this, "notif_disable");
        dojo.subscribe('moveLordsRight', this, "notif_moveLordsRight");
        dojo.subscribe('newLocations', this, "notif_newLocations");
        dojo.subscribe('control', this, "notif_control");
        dojo.subscribe('loseLocation', this, "notif_loseLocation");
        dojo.subscribe('score', this, "notif_score");
        dojo.subscribe('useLord', this, "notif_useLord");
        dojo.subscribe('refreshLords', this, "notif_refreshLords");
        dojo.subscribe('finalRound', this, "notif_finalRound");
        dojo.subscribe('endGame_scoring', this, "notif_endGame_scoring");
        // Depends on nbr. players
        var num_players = Object.keys(this.gamedatas.players).length;
        this.notifqueue.setSynchronous('endGame_scoring', 5000 * num_players + 3000);
        // Example 2: standard notification handling + tell the user interface to wait
        //            during 3 seconds after calling the method in order to let the players
        //            see what is happening in the game.
        // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
        // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
        //
    };
    Abyss.prototype.setScoringArrowRow = function (stage) {
        dojo.query('#game-scoring .arrow').style('visibility', 'hidden');
        dojo.query('.arrow', $('scoring-row-' + stage)).style('visibility', 'visible');
    };
    Abyss.prototype.setScoringRowText = function (stage, player_id, value) {
        $('scoring-row-' + stage + '-p' + player_id).innerHTML = value;
    };
    Abyss.prototype.setScoringRowWinner = function (winner_ids) {
        for (var i in winner_ids) {
            var player_id = winner_ids[i];
            dojo.addClass($('scoring-row-name-p' + player_id), 'wavetext');
            var stages = ['location', 'lord', 'affiliated', 'monster', 'total'];
            for (var j in stages) {
                var stage = stages[j];
                dojo.style($('scoring-row-' + stage + '-p' + player_id), { 'backgroundColor': 'rgba(255, 215, 0, 0.3)' });
            }
        }
    };
    Abyss.prototype.notif_finalRound = function (notif) {
        var playerId = notif.args.player_id;
        this.gamedatas.game_ending_player = playerId;
        dojo.style($('last-round'), { 'display': 'block' });
    };
    Abyss.prototype.notif_endGame_scoring = function (notif) {
        var breakdowns = notif.args.breakdowns;
        var winnerIds = notif.args.winner_ids;
        // Don't show the "final round" message if at the actual end
        dojo.style($('last-round'), { 'display': 'none' });
        dojo.style($('game-scoring'), { 'display': 'block' });
        var stages = ['location', 'lord', 'affiliated', 'monster', 'total'];
        var currentTime = 0;
        for (var i in stages) {
            var stage = stages[i];
            var breakdownStage = stage + '_points';
            if (stage == 'total') {
                breakdownStage = 'score';
            }
            // Set arrow to here
            setTimeout(this.setScoringArrowRow.bind(this, stage), currentTime);
            for (var player_id in this.gamedatas.players) {
                setTimeout(this.setScoringRowText.bind(this, stage, player_id, breakdowns[player_id][breakdownStage]), currentTime);
                currentTime += 1000;
            }
        }
        // Set winner to be animated!
        currentTime -= 500;
        setTimeout(this.setScoringRowWinner.bind(this, winnerIds), currentTime);
    };
    Abyss.prototype.notif_useLord = function (notif) {
        dojo.query(".lord.lord-" + notif.args.lord_id).forEach(function (node) {
            dojo.setAttr(node, "data-used", "1");
        });
    };
    Abyss.prototype.notif_refreshLords = function (notif) {
        dojo.query(".lord").forEach(function (node) {
            dojo.setAttr(node, "data-used", "0");
        });
    };
    Abyss.prototype.notif_score = function (notif) {
        var score = notif.args.score;
        var player_id = notif.args.player_id;
        this.scoreCtrl[player_id].toValue(score);
    };
    Abyss.prototype.notif_control = function (notif) {
        var location = notif.args.location;
        var lords = notif.args.lords;
        var player_id = notif.args.player_id;
        // Delete the location/lords
        dojo.query('.location.location-' + location.location_id).forEach(function (node) {
            dojo.destroy(node);
        });
        for (var i in lords) {
            var lord = lords[i];
            dojo.query('.lord.lord-' + lord.lord_id).forEach(function (node) {
                dojo.destroy(node);
            });
        }
        // Add the location to the player board
        var locations_holder = dojo.query('#player-panel-' + player_id + ' .locations')[0];
        var added_location = Location.placeWithTooltip(location, locations_holder);
        Location.organisePlayerBoard(player_id);
        // Add the lords to the location
        for (var i in lords) {
            var lord = lords[i];
            Lord.placeWithTooltip(lord, dojo.query('.trapped-lords-holder', added_location)[0]);
        }
        Lord.updateLordKeys(player_id);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_loseLocation = function (notif) {
        var location_id = notif.args.location_id;
        var player_id = notif.args.player_id;
        // Delete the location/lords
        dojo.query('.location.location-' + location_id).forEach(function (node) {
            dojo.destroy(node);
        });
        Lord.updateLordKeys(player_id);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_newLocations = function (notif) {
        var locations = notif.args.locations;
        var deck_size = notif.args.deck_size;
        for (var i in locations) {
            var location = locations[i];
            Location.placeWithTooltip(location, $('locations-holder'));
        }
        this.setDeckSize(dojo.query('#locations-holder .location-back'), deck_size);
    };
    Abyss.prototype.notif_disable = function (notif) {
        var lord_id = notif.args.lord_id;
        dojo.query('.lord-' + lord_id).addClass('disabled');
        for (var player_id in this.gamedatas.players) {
            Lord.updateLordKeys(player_id);
        }
    };
    Abyss.prototype.notif_allyDeckShuffle = function (notif) {
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
    };
    Abyss.prototype.notif_monsterReward = function (notif) {
        var player_id = notif.args.player_id;
        $('pearlcount_p' + player_id).innerHTML = +($('pearlcount_p' + player_id).innerHTML) + +notif.args.pearls;
        $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + +notif.args.monsters;
        $('keycount_p' + player_id).innerHTML = +($('keycount_p' + player_id).innerHTML) + +notif.args.keys;
        this.notif_setThreat({ args: { threat: 0 } });
    };
    Abyss.prototype.notif_monsterTokens = function (notif) {
        var monsters = notif.args.monsters;
        var monster_hand = $('monster-hand_p' + this.player_id);
        if (monster_hand) {
            dojo.style(monster_hand, "display", "block");
            for (var i in monsters) {
                dojo.place('<i class="icon icon-monster-faceup icon-monster-' + monsters[i].value + '">' + monsters[i].value + '</i>', monster_hand);
            }
        }
    };
    Abyss.prototype.notif_monsterHand = function (notif) {
        var monsters = notif.args.monsters;
        var playerId = notif.args.player_id;
        var monster_hand = $('monster-hand_p' + playerId);
        if (monster_hand) {
            dojo.style(monster_hand, "display", "block");
            monster_hand.innerHTML = '';
            for (var i in monsters) {
                dojo.place('<i class="icon icon-monster-faceup icon-monster-' + monsters[i].value + '">' + monsters[i].value + '</i>', monster_hand);
            }
        }
    };
    Abyss.prototype.notif_plot = function (notif) {
        var lord = notif.args.lord;
        var player_id = notif.args.player_id;
        var deck_size = +notif.args.deck_size;
        var pearls = +notif.args.pearls;
        var old_lord = notif.args.old_lord;
        $('pearlcount_p' + player_id).innerHTML = +($('pearlcount_p' + player_id).innerHTML) - pearls;
        var node = Lord.placeWithTooltip(lord, $('lords-track'));
        dojo.setStyle(node, "left", "13px");
        requestAnimationFrame(function () {
            dojo.setStyle(node, "left", "");
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
        if (old_lord) {
            dojo.query('.lord-' + old_lord.lord_id).forEach(function (node) { dojo.destroy(node); });
        }
    };
    Abyss.prototype.notif_affiliate = function (notif) {
        var ally = notif.args.ally;
        var player_id = notif.args.player_id;
        Ally.addAffiliated(player_id, ally);
        if (notif.args.also_discard) {
            // Also discard this ally from my hand!
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - 1;
            // If it's me, also delete the actual ally
            if (player_id == this.player_id) {
                dojo.query('#player-panel-' + this.player_id + ' .hand .ally[data-ally-id=' + ally.ally_id + ']').forEach(function (node) {
                    dojo.destroy(node);
                });
            }
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_explore = function (notif) {
        var ally = notif.args.ally;
        if (ally.faction == null)
            ally.faction = 'monster';
        var node = Ally.placeWithTooltip(ally, $('explore-track'));
        dojo.setStyle(node, "left", "9px");
        requestAnimationFrame(function () {
            dojo.setStyle(node, "left", "");
        });
        // Update ally decksize
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.lastExploreTime = new Date().getTime();
    };
    Abyss.prototype.notif_exploreTake = function (notif) {
        // If this comes right after notif_explore, we want to delay by about 1-2 seconds
        var deltaTime = this.lastExploreTime ? (new Date().getTime() - this.lastExploreTime) : 1000;
        if (deltaTime < 2000) {
            var self_1 = this;
            setTimeout(function () {
                self_1.notif_exploreTake_real(notif);
            }, 2000 - deltaTime);
        }
        else {
            this.notif_exploreTake_real(notif);
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_exploreTake_real = function (notif) {
        var player_id = notif.args.player_id;
        var slot = notif.args.slot;
        // For each slot, animate to the council pile, fade out and destroy, then increase the council pile by 1
        var delay = 0;
        var self = this;
        var _loop_4 = function () {
            ally = dojo.query('#explore-track .slot-' + i);
            if (ally.length > 0) {
                var theAlly_1 = ally[0];
                faction = dojo.attr(theAlly_1, 'data-faction');
                dojo.setStyle(theAlly_1, "transition", "none");
                if (faction == 'monster') {
                    // Monster just fades out
                    this_1.fadeOutAndDestroy(theAlly_1, 400, delay);
                    delay += 200;
                }
                else if (i != slot) {
                    // Animate to the council!
                    var deck_1 = dojo.query('#council-track .slot-' + faction);
                    animation = this_1.slideToObject(theAlly_1, deck_1[0], 600, delay);
                    animation.onEnd = function () {
                        dojo.destroy(theAlly_1);
                        var num = +dojo.attr(deck_1[0], 'data-size') + 1;
                        self.setDeckSize(deck_1, num);
                    };
                    animation.play();
                    delay += 200;
                }
                else {
                    // This is the card that was taken - animate it to hand or player board
                    if (player_id == this_1.player_id) {
                        dojo.setStyle(theAlly_1, "zIndex", "1");
                        dojo.setStyle(theAlly_1, "transition", "none");
                        animation = this_1.slideToObject(theAlly_1, $('player-hand'), 600, delay);
                        animation.onEnd = function () {
                            dojo.destroy(theAlly_1);
                            Ally.addHand(player_id, notif.args.ally);
                            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
                        };
                        animation.play();
                        delay += 200;
                    }
                    else {
                        dojo.setStyle(theAlly_1, "zIndex", "1");
                        dojo.setStyle(theAlly_1, "transition", "none");
                        animation = this_1.slideToObject(theAlly_1, $('player_board_' + player_id), 600, delay);
                        animation.onEnd = function () {
                            dojo.destroy(theAlly_1);
                            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
                        };
                        animation.play();
                        delay += 200;
                    }
                }
            }
        };
        var this_1 = this, ally, faction, animation, animation, animation;
        for (var i = 1; i <= 5; i++) {
            _loop_4();
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_purchase = function (notif) {
        var player_id = notif.args.player_id;
        var theAlly = dojo.query('#explore-track .slot-' + notif.args.slot)[0];
        // Update handsize and pearls of purchasing player
        $('pearlcount_p' + player_id).innerHTML = +($('pearlcount_p' + player_id).innerHTML) - notif.args.cost;
        $('pearlcount_p' + notif.args.first_player_id).innerHTML = +($('pearlcount_p' + notif.args.first_player_id).innerHTML) + +notif.args.cost;
        if (player_id == this.player_id) {
            dojo.setStyle(theAlly, "zIndex", "1");
            dojo.setStyle(theAlly, "transition", "none");
            var animation = this.slideToObject(theAlly, $('player-hand'), 600);
            animation.onEnd = function () {
                dojo.destroy(theAlly);
                Ally.addHand(player_id, notif.args.ally);
                $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
            };
            animation.play();
        }
        else {
            dojo.setStyle(theAlly, "zIndex", "1");
            dojo.setStyle(theAlly, "transition", "none");
            var animation = this.slideToObject(theAlly, $('player_board_' + player_id), 600);
            animation.onEnd = function () {
                dojo.destroy(theAlly);
                $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
            };
            animation.play();
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_setThreat = function (notif) {
        // Update handsize and pearls of purchasing player
        var tt = $('threat-token');
        dojo.removeClass(tt, 'slot-0 slot-1 slot-2 slot-3 slot-4 slot-5');
        dojo.addClass(tt, 'slot-' + notif.args.threat);
    };
    Abyss.prototype.notif_discardCouncil = function (notif) {
        var player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var num = notif.args.num;
        // Empty the council pile
        var deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);
    };
    Abyss.prototype.notif_requestSupport = function (notif) {
        var player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var num = notif.args.num;
        var deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);
        // Add cards to the player's hand
        if (player_id != this.player_id) {
            for (var i = 0; i < num; i++) {
                var anim = this.slideTemporaryObject(Ally.renderBack(), 'council-track', 'council-track-' + faction, $('player_board_' + player_id), 600, i * 200);
                dojo.connect(anim, 'onEnd', function () {
                    $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
                });
            }
        }
        else {
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + num;
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_requestSupportCards = function (notif) {
        var player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var allies = notif.args.allies;
        // Add cards to the player's hand
        var delay = 0;
        var _loop_5 = function () {
            var ally = allies[j];
            anim = this_2.slideTemporaryObject(Ally.render(ally), 'council-track', 'council-track-' + faction, $('player-hand'), 600, delay);
            dojo.connect(anim, 'onEnd', function () {
                Ally.addHand(player_id, ally);
            });
            delay += 200;
        };
        var this_2 = this, anim;
        for (var j in allies) {
            _loop_5();
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_moveLordsRight = function (notif) {
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
    };
    Abyss.prototype.notif_recruit = function (notif) {
        var lord = notif.args.lord;
        var player_id = +notif.args.player_id;
        var spent_pearls = +notif.args.spent_pearls;
        var spent_lords = notif.args.spent_lords;
        var spent_allies = notif.args.spent_allies;
        // Remove lord from the track
        if (lord) {
            dojo.query("#lords-track .lord[data-lord-id=" + lord.lord_id + "]").forEach(function (node) {
                dojo.destroy(node);
            });
        }
        // Spend pearls and allies
        if (spent_allies)
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - spent_allies.length;
        if (spent_pearls)
            $('pearlcount_p' + player_id).innerHTML = +($('pearlcount_p' + player_id).innerHTML) - spent_pearls;
        // If it's me, then actually get rid of the allies
        if (spent_allies && +player_id == +this.player_id) {
            for (var i in spent_allies) {
                var ally = spent_allies[i];
                dojo.query('#player-panel-' + player_id + ' .hand .ally[data-ally-id=' + ally.ally_id + ']').forEach(function (node) {
                    dojo.destroy(node);
                });
            }
        }
        if (spent_lords) {
            for (var i in spent_lords) {
                var lord2 = spent_lords[i];
                dojo.query('#player-panel-' + player_id + ' .lord[data-lord-id=' + lord2.lord_id + ']').forEach(function (node) {
                    dojo.destroy(node);
                });
            }
        }
        // Add the lord
        if (lord) {
            Lord.placeWithTooltip(lord, dojo.query('#player-panel-' + player_id + ' .free-lords')[0]);
        }
        Lord.updateLordKeys(player_id);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_refillLords = function (notif) {
        var lords = notif.args.lords;
        var player_id = +notif.args.player_id;
        var deck_size = notif.args.deck_size;
        var _loop_6 = function () {
            lord = lords[i];
            if (dojo.query("#lords-track .lord[data-lord-id=" + lord.lord_id + "]").length == 0) {
                var node_1 = Lord.placeWithTooltip(lord, $('lords-track'));
                dojo.setStyle(node_1, "left", "13px");
                requestAnimationFrame(function () {
                    dojo.setStyle(node_1, "left", "");
                });
            }
        };
        var lord;
        for (var i in lords) {
            _loop_6();
        }
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
    };
    Abyss.prototype.notif_diff = function (notif) {
        var player_id = +notif.args.player_id;
        var source = notif.args.source;
        var source_player_id = null;
        if (source.startsWith("player_")) {
            source_player_id = +source.slice("player_".length);
        }
        // TODO : Animate based on 'source'
        // If source starts "lord_" animate to the lord
        if (notif.args.pearls) {
            var pearls = notif.args.pearls;
            $('pearlcount_p' + player_id).innerHTML = +($('pearlcount_p' + player_id).innerHTML) + +pearls;
        }
        if (notif.args.keys) {
            var keys = notif.args.keys;
            $('keycount_p' + player_id).innerHTML = +($('keycount_p' + player_id).innerHTML) + +keys;
        }
        if (notif.args.allies_lost) {
            var allies = notif.args.allies_lost;
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - +allies.length;
            // If it's me, also delete the actual ally
            if (notif.args.player_id == this.player_id) {
                for (var i in allies) {
                    var ally = allies[i];
                    dojo.query('#player-panel-' + this.player_id + ' .hand .ally[data-ally-id=' + ally.ally_id + ']').forEach(function (node) {
                        dojo.destroy(node);
                    });
                }
            }
        }
        if (notif.args.monster) {
            $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + notif.args.monster.length;
            if (source_player_id) {
                $('monstercount_p' + source_player_id).innerHTML = +($('monstercount_p' + source_player_id).innerHTML) - notif.args.monster.length;
                if (source_player_id == this.player_id) {
                    // Remove it from me
                    var monster_hand = $('monster-hand_p' + this.player_id);
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
            if (player_id == this.player_id) {
                // Add it to me
                var monster_hand = $('monster-hand_p' + this.player_id);
                if (monster_hand) {
                    dojo.style(monster_hand, "display", "block");
                    for (var i in notif.args.monster) {
                        dojo.place('<i class="icon icon-monster-faceup icon-monster-' + notif.args.monster[i].value + '">' + notif.args.monster[i].value + '</i>', monster_hand);
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
    };
    return Abyss;
}());
define([
    "dojo", "dojo/_base/declare", "dojo/debounce",
    "dojo/_base/fx", "dojo/fx",
    "dojo/NodeList-traverse",
    "ebg/core/gamegui",
    "ebg/counter",
], function (dojo, declare, pDebounce) {
    debounce = pDebounce;
    return declare("bgagame.abyss", ebg.core.gamegui, new Abyss());
});
