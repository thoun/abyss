class LordManager extends CardManager<AbyssLord> {
  constructor(public game: AbyssGame) {
    super(game, {
      getId: lord => `lord-${lord.lord_id}`,
      setupDiv: (lord, div) => {
        div.classList.add(`lord`);
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
        div.dataset.lordId = `${lord.lord_id}`;
        div.classList.add(`lord-side`, `lord-${lord.lord_id}`);
        div.innerHTML = `
          <span class="lord-desc"><span class="lord-name">${_(lord.name)}</span>${_(lord.desc)}</span>
        `;
      },
      setupBackDiv: (lord, div) => {
        div.classList.add(`lord-side`, `lord-back`);
      },
    });
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
    const guilds = [
      '<span style="color: purple">' + _('Mage') + '</span>',
      '<span style="color: red">' + _('Soldier') + '</span>',
      '<span style="color: #999900">' + _('Farmer') + '</span>',
      '<span style="color: green">' + _('Merchant') + '</span>',
      '<span style="color: blue">' + _('Politician') + '</span>',
      '<span style="color: gray">' + _('Ambassador') + '</span>',
    ];
    guilds[10] = '<span style="color: gray">' + _('Smuggler') + '</span>';
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
    const playerId = this.game.getPlayerId();
    
    // Only show true costs for lords in the row
    
    // I have the Treasurer (25) : cost - 2
    if (dojo.query('#player-panel-'+playerId+' .free-lords .lord-25:not(.disabled)').length > 0) {
      trueCost -= 2;
    }
    
    // I don't have the protector (14) ...
    if (dojo.query('#player-panel-'+playerId+' .free-lords .lord-14:not(.disabled)').length == 0) {
      // Another player has the Recruiter (1) : cost + 2
      if (dojo.query('.player-panel:not(#player-panel-'+playerId+') .free-lords .lord-1:not(.disabled)').length > 0) {
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
