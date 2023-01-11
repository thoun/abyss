class AllyManager extends CardManager<AbyssAlly> {

  constructor(public game: AbyssGame) {
    super(game, {
      getId: ally => `ally-${ally.ally_id}`,
      setupDiv: (ally, div) => {
        div.classList.add(`ally`);
        div.dataset.allyId = `${ally.ally_id}`;
        div.dataset.faction = `${ally.faction}`;
        div.dataset.value = `${ally.value}`;

        this.game.connectTooltip(div, this.renderTooltip(ally), "ally");
      },
      setupFrontDiv: (ally, div) => {
        div.dataset.faction = `${ally.faction}`;
        div.dataset.value = `${ally.value}`;
        div.classList.add('ally-side', `ally-${ally.faction}-${ally.value}`);
      },
      setupBackDiv: (ally, div) => {
        div.classList.add('ally-side', `ally-back`);
      },
    });
  }

  allyNameText(faction: number) {
    // 1 Crab, coloured
    let allies = [
      '<span style="color: purple">' + _('Jellyfish') + '</span>',
      '<span style="color: red">' + _('Crab') + '</span>',
      '<span style="color: #999900">' + _('Seahorse') + '</span>',
      '<span style="color: green">' + _('Shellfish') + '</span>',
      '<span style="color: blue">' + _('Squid') + '</span>'
    ];
    allies[10] = '<span style="color: gray">' + _('Kraken') + '</span>';
    return allies[faction];
  }

  renderTooltip(ally: AbyssAlly) {
    if (ally.faction !== null && ally.faction != 100) {
      return `<div class="abs-tooltip-ally">
        ${this.allyNameText(ally.faction)}
        <br>
        <span style="font-size: smaller"><b>${_("Value")}: </b> ${_(ally.value)}</span>
      </div>`;
    } else {
      return `<div class="abs-tooltip-ally">
        ${_("Monster")}
      </div>`;
    }
  }

  renderBack() {
    return `<div class="ally ally-black" style="z-index: 1"></div>`;
  }

  factionIcon(f: number) {
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
  }
}
