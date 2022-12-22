class AllyManager extends CardManager<AbyssAlly> {
  private static uniqueId: number = 0;

  constructor(public game: AbyssGame) {
    super(game, {
      getId: ally => `ally-${ally.ally_id}`,
      setupDiv: (ally, div) => {
        div.classList.add(`ally`, `ally-${ally.faction}-${ally.value}`);
        if (ally.place >= 0) {
          div.classList.add(`slot-${ally.place}`);
        }
        div.dataset.allyId = `${ally.ally_id}`;
        div.dataset.faction = `${ally.faction}`;
        div.dataset.value = `${ally.value}`;

        this.game.connectTooltip(div, this.renderTooltip(ally), "ally");
      },
      setupFrontDiv: (ally, div) => {
        div.classList.add( `ally-${ally.faction}-${ally.value}`);
      },
    });
  }

  render(ally: AbyssAlly) {
    return `<div id="ally-uid-${++AllyManager.uniqueId}" data-ally-id="${ally.ally_id}" data-faction="${ally.faction}" data-value="${ally.value}" class="ally ally-${ally.faction}-${ally.value} ${ally.place >= 0 ? ('slot-' + ally.place) : ''}"></div>`;
  }

  placeWithTooltip(ally: AbyssAlly, parent) {
    let node = dojo.place( this.render(ally), parent );
    this.game.connectTooltip( node, this.renderTooltip(ally), "ally" );
    return node;
  }

  allyNameText(ally: AbyssAlly) {
    // 1 Crab, coloured
    let allies = [
      '<span style="color: purple">' + _('Jellyfish') + '</span>',
      '<span style="color: red">' + _('Crab') + '</span>',
      '<span style="color: #999900">' + _('Seahorse') + '</span>',
      '<span style="color: green">' + _('Shellfish') + '</span>',
      '<span style="color: blue">' + _('Squid') + '</span>'
    ];
    return allies[+ally.faction];
  }

  renderTooltip(ally: AbyssAlly) {
    if (ally.faction >= 0) {
      return `<div class="abs-tooltip-ally">
        ${this.allyNameText(ally)}
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
