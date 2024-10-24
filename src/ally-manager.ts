class AllyManager extends CardManager<AbyssAlly> {

  constructor(public game: AbyssGame) {
    super(game, {
      animationManager: game.animationManager,
      getId: ally => `ally-${ally.ally_id}`,
      setupDiv: (ally, div) => {
        div.classList.add(`ally`);
        div.dataset.allyId = `${ally.ally_id}`;
        div.dataset.faction = `${ally.faction}`;
        div.dataset.value = `${ally.value}`;

        this.game.setTooltip(div.id, this.renderTooltip(ally));
      },
      setupFrontDiv: (ally, div) => {
        div.dataset.faction = `${ally.faction}`;
        div.dataset.value = `${ally.value}`;
        if (ally.effect) {
          div.dataset.effect = `${ally.effect}`;
        }
        div.classList.add('ally-side', `ally-${ally.faction}-${ally.value}`);
      },
      setupBackDiv: (ally, div) => {
        div.classList.add('ally-side', `ally-back`);
      },
      isCardVisible: ally => true, //Boolean(ally.value), // monster doesn't have value or faction
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
      let html = `<div class="abs-tooltip-ally">
      ${this.allyNameText(ally.faction)}
      <br>
      <span style="font-size: smaller"><b>${_("Value")}: </b> ${_(ally.value)}</span>`;
      if (ally.effect) {
        let effect = '';
        switch (ally.effect) {
          case 1: effect = _('After rolling the die, you can spend as many Pearls as you want to add to your Attack power: + 1 per Pearl.'); break;
          case 2: effect = _('To calculate your Attack power, roll BOTH dice and take into account only the higher of the two values.'); break;
        }
        html += `<br>
      <span style="font-size: smaller"><b>${_("Effect")}: </b> ${_(effect)}</span>`;
      }
        console.warn(ally);
      html += `</div>`;
      return html;
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
