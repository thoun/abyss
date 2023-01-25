class LootManager extends CardManager<AbyssLoot> {
  constructor(public game: AbyssGame) {
    super(game, {
      getId: loot => `loot-${loot.id}`,
      setupDiv: (loot, div) => {
        div.classList.add(`loot`);

        this.game.setTooltip(div.id, this.renderTooltip(loot));
      },
      setupFrontDiv: (loot, div) => {
        div.dataset.value = `${loot.value}`;
      },
    });
  }

  private getEffect(value: number) {
    switch (value) {
      case 3:
        return _('Gives a key token');
      case 4:
        return _('Gives 2 pearls');
      case 5:
        return _('Draw a monster token');
      case 6:
        return _('Draw the top card from the Exploration draw deck');
      default:
        return _('Nothing');
    }
  }

  private renderTooltip(loot: AbyssLoot): string {
    return `<div class="abs-tooltip-ally">
      ${_('Loot')}
      <br>
      <span style="font-size: smaller"><b>${_("Value")}: </b> ${loot.value}</span>
      <br>
      <span style="font-size: smaller"><b>${_("Effect")}: </b> ${this.getEffect(loot.value)}</span>
      <div></div>
    </div>`;
  }
}
