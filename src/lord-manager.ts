class LordManager extends CardManager<AbyssLord> {
  private static uniqueId: number = 0;

  constructor(public game: AbyssGame) {
    super(game, {
      getId: lord => `lord-${lord.lord_id}`,
      setupDiv: (lord, div) => {
        div.classList.add(`lord`, `lord-${lord.lord_id}`, `slot-${lord.place}`, `transition-position`);
        if (lord.turned) {
          div.classList.add(`disabled`);
        }
        div.dataset.lordId = `${lord.lord_id}`;
        div.dataset.cost = `${lord.cost}`;
        div.dataset.diversity = `${lord.diversity}`;
        div.dataset.used = `${lord.used}`;
        div.dataset.turned = `${lord.turned}`;
        div.dataset.effect = `${lord.effect}`;
        div.dataset.keys = `${lord.keys}`;

        this.game.connectTooltip(div, this.renderTooltip(lord), "lord" );
      },
      setupFrontDiv: (lord, div) => {
        div.classList.add(`lord-${lord.lord_id}`);
        div.innerHTML = `
          <span class="lord-desc"><span class="lord-name">${_(lord.name)}</span>${_(lord.desc)}</span>
        `;
      },
    });
  }

  // TODO : Names need to move outside of PHP and into js for i18n
  render(lord: AbyssLord) {
    return `<div id="lord-uid-${++LordManager.uniqueId}" class="lord lord-${lord.lord_id} slot-${lord.place} transition-position ${lord.turned  ? 'disabled' : ''}" data-lord-id="${lord.lord_id}" data-cost="${lord.cost}" data-diversity="${lord.diversity}" data-used="${lord.used}" data-turned="${lord.turned}" data-effect="${lord.effect}" data-keys="${lord.keys}">
      <span class="lord-desc"><span class="lord-name">${_(lord.name)}</span>${_(lord.desc)}</span>
    </div>`;
  }

  renderTooltip(lord: AbyssLord) {
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
    let costNumber: number | string = lord.cost;
    let trueCost = costNumber;
    
    // Only show true costs for lords in the row
    
    // I have the Treasurer (25) : cost - 2
    if (dojo.query('#player-panel-'+(this.game as any).player_id+' .free-lords .lord-25:not(.disabled)').length > 0) {
      trueCost -= 2;
    }
    
    // I don't have the protector (14) ...
    if (dojo.query('#player-panel-'+(this.game as any).player_id+' .free-lords .lord-14:not(.disabled)').length == 0) {
      // Another player has the Recruiter (1) : cost + 2
      if (dojo.query('.player-panel:not(#player-panel-'+(this.game as any).player_id+') .free-lords .lord-1:not(.disabled)').length > 0) {
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
  }

  placeWithTooltip(lord: AbyssLord, parent) {
    let node = dojo.place( this.render(lord), parent );
    this.game.connectTooltip( node, this.renderTooltip.bind(this, lord), "lord" );
    return node;
  }

  updateLordKeys(playerId: number | string) {
    let playerPanel = $('player-panel-' + playerId);
    let lords = dojo.query('.free-lords .lord', playerPanel);
    let keys = 0;
    let numLords = dojo.query('.lord', playerPanel).length;
    for (let i = 0; i < lords.length; i++) {
      let lord = lords[i];
      if (!dojo.hasClass(lord, "disabled")) {
        const keysStr = lord.getAttribute("data-keys");
        keys += isNaN(keysStr) ? 0 : Number(keysStr);
      }
    }
    $('lordkeycount_p' + playerId).innerHTML = keys;
    $('lordcount_p' + playerId).innerHTML = numLords;
  }
}
