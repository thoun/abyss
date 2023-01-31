class MonsterManager extends CardManager<AbyssMonster> {
  constructor(public game: AbyssGame) {
    super(game, {
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

        div.dataset.value = `${monster.value}`;
        if (monster.effect) {
          div.dataset.effect = `${monster.effect}`;
        }
        
        this.game.setTooltip(div.id, monster.type == 1 ? /* TODO LEV _*/('Leviathan Monster token') : /* TODO LEV _*/('Base game Monster token'));
      },
    });
  }

  private getEffect(value: number) {
    switch (value) {
      case 1:
        return /*TODO LEV_*/('Gain 2 pearls');
      case 2:
        return /*TODO LEV_*/('Gain 3 pearls');
      case 3:
        return /*TODO LEV_*/('Gain 1 key');
      case 4:
        return /*TODO LEV_*/('Gain 1 Council stack');
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
