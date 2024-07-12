class MonsterManager extends CardManager<AbyssMonster> {
  constructor(public game: AbyssGame) {
    super(game, {
      animationManager: game.animationManager,
      getId: monster => `monster-${monster.monster_id}`,
      setupDiv: (monster, div) => {
        div.classList.add(`monster`);
        div.dataset.type = `${monster.type}`;
      },
      setupFrontDiv: (monster, div) => {
        div.id = `${this.getId(monster)}-front`;

        if (monster.value) {
          div.dataset.value = `${monster.value}`;
          div.innerHTML = `${monster.value}`;
        }
        if (monster.effect) {
          div.dataset.effect = `${monster.effect}`;
        }

        this.game.setTooltip(div.id, this.renderTooltip(monster));
      },
      setupBackDiv: (monster, div) => {
        div.id = `${this.getId(monster)}-back`;
        
        this.game.setTooltip(div.id, monster.type == 1 ? _('Leviathan Monster token') : _('Base game Monster token'));
      },
      isCardVisible: monster => Boolean(monster.value) || Boolean(monster.effect),
    });
  }

  private getEffect(value: number) {
    switch (value) {
      case 1:
        return _('Gain 2 pearls');
      case 2:
        return _('Gain 3 pearls');
      case 3:
        return _('Gain 1 key');
      case 4:
        return _('Gain 1 Council stack');
      default:
        return _('Nothing');
    }
  }

  private renderTooltip(monster: AbyssMonster): string {
    return `<div>
      ${_('Monster token')}<br>
      ${monster.value ? `<span style="font-size: smaller"><b>${_("Value")}: </b> ${monster.value}</span>` : ''}
      ${monster.effect ? `<span style="font-size: smaller"><b>${_("Effect")}: </b> ${this.getEffect(monster.effect)}</span>` : ''}
    </div>`;
  }
}
