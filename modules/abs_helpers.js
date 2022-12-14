let Ally = {
  uniqueId: 0,
  render: function (ally) {
    Ally.uniqueId++;
    return `<div id="ally-uid-${Ally.uniqueId}" data-ally-id="${ally.ally_id}" data-faction="${ally.faction}" data-value="${ally.value}" class="ally ally-${ally.faction}-${ally.value} ${ally.place >= 0 ? ('slot-' + ally.place) : ''}"></div>`;
  },
  placeWithTooltip: function(ally, parent) {
    let node = dojo.place( Ally.render(ally), parent );
    Tooltip.connect( node, Ally.renderTooltip(ally), "ally" );
    return node;
  },
  allyNameText: function(ally) {
    // 1 Crab, coloured
    let allies = [
      '<span style="color: purple">' + _('Jellyfish') + '</span>',
      '<span style="color: red">' + _('Crab') + '</span>',
      '<span style="color: #999900">' + _('Seahorse') + '</span>',
      '<span style="color: green">' + _('Shellfish') + '</span>',
      '<span style="color: blue">' + _('Squid') + '</span>'
    ];
    return allies[+ally.faction];
  },
  renderTooltip: function(ally) {
    if (ally.faction >= 0) {
      let allies = [
        '<span style="color: purple">' + _('Jellyfish') + '</span>',
        '<span style="color: red">' + _('Crab') + '</span>',
        '<span style="color: #999900">' + _('Seahorse') + '</span>',
        '<span style="color: green">' + _('Shellfish') + '</span>',
        '<span style="color: blue">' + _('Squid') + '</span>'
      ];
      return `<div class="abs-tooltip-ally">
        ${Ally.allyNameText(ally)}
        <br>
        <span style="font-size: smaller"><b>${_("Value")}: </b> ${_(ally.value)}</span>
      </div>`;
    } else {
      return `<div class="abs-tooltip-ally">
        ${_("Monster")}
      </div>`;
    }
  },
  renderBack: function () {
    return `<div class="ally ally-black" style="z-index: 1"></div>`;
  },
  factionIcon: function(f) {
    // TODO : Actual icon?
    if (f == 0) {
      return 'Purple';
    } else if (f == 1) {
      return 'Red';
    } else if (f == 2) {
      return 'Yellow';
    } else if (f == 3) {
      return 'Green';
    } else if (f == 4) {
      return 'Blue';
    }
  },
  placeAffiliated: function(allies, panel) {
    let parent = dojo.query('div.affiliated', panel)[0];
    var result = "";
    for (var faction=0; faction < 5; faction++) {
      var alliesFragment = "";
      let factionHolder = dojo.create("div");
      factionHolder.className = "affiliated-faction";
      factionHolder.setAttribute("data-faction", faction);
      for (var j in allies) {
        var ally = allies[j];
        if (ally.faction == faction) {
          alliesFragment = Ally.render(ally) + alliesFragment;
          
          let newNode = dojo.place(Ally.render(ally), factionHolder, "first");
          Tooltip.connect( newNode, Ally.renderTooltip(ally), "ally" );
        }
      }
      dojo.place(factionHolder, parent);
    }
    return parent;
  },
  addHand: function(player_id, ally) {
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
    let newNode = dojo.place(Ally.render(ally), refNode, pos);
    Tooltip.connect( newNode, Ally.renderTooltip(ally), "ally" );
    gameui.organisePanelMessages();
    return newNode;
  },
  addAffiliated: function(player_id, ally) {
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
    let newNode = dojo.place(Ally.render(ally), refNode, pos);
    Tooltip.connect( newNode, Ally.renderTooltip(ally), "ally" );
    return newNode;
  }
};

let Lord = {
  uniqueId: 0,
  // TODO : Names need to move outside of PHP and into js for i18n
  render: function (lord) {
    Lord.uniqueId++;
    return `<div id="lord-uid-${Lord.uniqueId}" class="lord lord-${lord.lord_id} slot-${lord.place} transition-position ${(lord.turned == 1) ? 'disabled' : ''}" data-lord-id="${lord.lord_id}" data-cost="${lord.cost}" data-diversity="${lord.diversity}" data-used="${lord.used}" data-turned="${lord.turned}" data-effect="${lord.effect}" data-keys="${lord.keys}">
      <span class="lord-desc"><span class="lord-name">${_(lord.name)}</span>${_(lord.desc)}</span>
    </div>`;
  },
  renderTooltip: function(lord) {
    let descSection = "";
    if (lord.desc != "") {
      descSection = '<hr>';
      if (lord.effect == 1) {
        descSection += '<b>' + _('When recruited') + ':</b> ';
      }
      descSection += _(lord.desc);
    }
    let guilds = [
      '<span style="color: purple">' + _('Mage') + '</span>',
      '<span style="color: red">' + _('Soldier') + '</span>',
      '<span style="color: #999900">' + _('Farmer') + '</span>',
      '<span style="color: green">' + _('Merchant') + '</span>',
      '<span style="color: blue">' + _('Politician') + '</span>',
      '<span style="color: gray">' + _('Ambassador') + '</span>'
    ];
    let factionSection = "";
    if (lord.faction != null) {
      factionSection = '<span style="font-size: smaller">' + guilds[lord.faction] + "</span><br>";
    } else {
      factionSection = '<span style="font-size: smaller">' + guilds[guilds.length - 1] + "</span><br>";
    }
    let diversitySection = "";
    for (let i = 0; i < lord.diversity; i++) {
      let colour = "#666";
      if (i == 0 && lord.faction != null) {
        if (lord.faction == 0) {
          colour = "purple";
        } else if (lord.faction == 1) {
          colour = "red";
        } else if (lord.faction == 2) {
          colour = "#999900";
        } else if (lord.faction == 3) {
          colour = "green";
        } else if (lord.faction == 4) {
          colour = "blue";
        }
      }
      diversitySection += `<div style="display: inline-block; margin-right: 2px; width: 10px; height: 10px; border-radius: 5px; background-color: ${colour};"></div>`;
    }
    let keysString = "";
    for (let i = 0; i < lord.keys; i++) {
      keysString += ' <i class="icon icon-key"></i>';
    }
    let costString = _('Cost');
    let costNumber = lord.cost;
    let trueCost = costNumber;
    
    // Only show true costs for lords in the row
    
    // I have the Treasurer (25) : cost - 2
    if (dojo.query('#player-panel-'+gameui.player_id+' .free-lords .lord-25:not(.disabled)').length > 0) {
      trueCost -= 2;
    }
    
    // I don't have the protector (14) ...
    if (dojo.query('#player-panel-'+gameui.player_id+' .free-lords .lord-14:not(.disabled)').length == 0) {
      // Another player has the Recruiter (1) : cost + 2
      if (dojo.query('.player-panel:not(#player-panel-'+gameui.player_id+') .free-lords .lord-1:not(.disabled)').length > 0) {
        trueCost = +trueCost + 2;
      }
    }
    
    if (+trueCost < 0) trueCost = 0;
    
    if (+trueCost != +costNumber) {
      costNumber = `<del>${costNumber}</del> ${trueCost}`;
    }
    
    return `<div class="abs-tooltip-lord">
      <span style="float: right">${_(lord.points)} <i class="fa fa-star"></i>${keysString}</span>
      <h3 style="padding-right: 60px;">${_(lord.name)}</h3>
      ${factionSection}
      <span style="font-size: smaller"><b>${costString}: </b> ${costNumber} ${diversitySection}</span>
      ${descSection}
    </div>`;
  },
  placeWithTooltip: function(lord, parent) {
    let node = dojo.place( Lord.render(lord), parent );
    Tooltip.connect( node, Lord.renderTooltip.bind(this, lord), "lord" );
    return node;
  },
  updateLordKeys: function(playerId) {
    let playerPanel = $('player-panel-' + playerId);
    let lords = dojo.query('.free-lords .lord', playerPanel);
    let keys = 0;
    let numLords = dojo.query('.lord', playerPanel).length;
    for (let i = 0; i < lords.length; i++) {
      let lord = lords[i];
      if (! dojo.hasClass(lord, "disabled")) {
        keys += +lord.getAttribute("data-keys");
      }
    }
    $('lordkeycount_p' + playerId).innerHTML = keys;
    $('lordcount_p' + playerId).innerHTML = numLords;
  }
};

let Location = {
  uniqueId: 0,
  makeDesc: function(location, laurel) {
    let pointsReplacement = laurel ? '<i class="icon icon-laurel"></i>' : ' <i class="fa fa-star"></i>';
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

    return `<div id="location-uid-${Location.uniqueId}" class="location board location-${location.location_id}" data-location-id="${location.location_id}">
      <div class="location-clicker"></div>
      <span class="location-name">${_(location.name)}</span>
      <span class="location-desc">${desc}</span>
      <div class="trapped-lords-holder"></div>
    </div>`;
  },
  placeLords: function(locationNode, lords) {
    for (let i in lords) {
      let lord = lords[i];
      let parent = dojo.query('.trapped-lords-holder', locationNode)[0];
      Lord.placeWithTooltip(lord, parent);
    }
  },
  organisePlayerBoard: function(player_id) {
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
  renderTooltip: function(location) {
    var desc = Location.makeDesc(location);
    return `<div class="abs-tooltip-location">
      <h3 style="padding-right: 50px;">${_(location.name)}</h3>
      <hr>
      ${desc}
    </div>`;
  },
  placeWithTooltip: function(location, parent) {
    let node = dojo.place( Location.render(location), parent );
    Tooltip.connect( node, Location.renderTooltip(location), "location" );
    if (parent && parent.id == 'locations-holder') {
      Location.organise();
    }
    return node;
  },
  organise: function() {
    // First, move all in overflow back to holder
    let overflowLocations = dojo.query('.location:not(.location-back)', $('locations-holder-overflow'));
    for (let i = 0; i < overflowLocations.length; i++) {
      $('locations-holder').appendChild(overflowLocations[i]);
    }
    
    // If on playmat:
    if (dojo.hasClass($('game-board-holder'), "playmat")) {
      // Then, move all beyond 5 into the overflow
      let locations = dojo.query('.location:not(.location-back)', $('locations-holder'));
      if (locations.length > 5) {
        for (let i = 5; i < locations.length; i++) {
          // move to overflow...
          $('locations-holder-overflow').appendChild(locations[i]);
        }
      }
    }
  },
};

let Tooltip = {
  connect: function(node, html, offsetType) {
    let tt = $('abs-tooltip-0');
    dojo.connect(node, "onmouseenter", function() {
      if (gameui.prefs[200].value == 1) {
        return;
      }
      let r = node.getBoundingClientRect();
      let outer = $('game-holder').getBoundingClientRect();
      let left = r.left - outer.left;
      let top = r.top - outer.top;
      
      let zoomSupported = gameui.useZoom;
      
      // Always include content zoom
      let contentZoom = zoomSupported ? (+dojo.style($('page-content'), 'zoom') || 1) : 1;
      let totalZoom = contentZoom;
      
      // Only include game zoom if the node is in the zoomed element
      let gameZoom = 1;
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
        tt.innerHTML = html.call(this)
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
    dojo.connect(node, "onmouseleave", function() {
      dojo.style(tt, {'opacity': '0'});
    });
  }
};