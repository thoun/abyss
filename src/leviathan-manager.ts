class LeviathanManager extends CardManager<AbyssLeviathan> {
  constructor(public game: AbyssGame) {
    super(game, {
      animationManager: game.animationManager,
      getId: leviathan => `leviathan-${leviathan.id}`,
      setupDiv: (leviathan: AbyssLeviathan, div: HTMLDivElement) => {
        div.classList.add(`leviathan-card`);
      },
      setupFrontDiv: (leviathan: AbyssLeviathan, div: HTMLDivElement) => {
        if (div.querySelector('.icon-life')) {
          return;
        }

        const imagePosition = leviathan.id - 1;
        const image_items_per_row = 5;
        var row = Math.floor(imagePosition / image_items_per_row);
        const xBackgroundPercent = (imagePosition - (row * image_items_per_row)) * 100;
        const yBackgroundPercent = row * 100;
        div.style.backgroundPosition = `-${xBackgroundPercent}% -${yBackgroundPercent}%`;

        div.insertAdjacentHTML('beforeend', `<div class="icon leviathan-icon icon-life"></div>`);
        
        this.setLife(leviathan, div);
      },
      isCardVisible: () => true,
      //cardHeight: 358,
      //cardWidth: 550,
      cardHeight: 88,
      cardWidth: 136,
    });
  }

  public setLife(leviathan: AbyssLeviathan, div?: HTMLDivElement) {
    if (!div) {
      div = this.getCardElement(leviathan).querySelector('.front');
    }
    const icon = div.querySelector('.icon-life') as HTMLDivElement;
    icon.style.bottom = `${5 + ((leviathan.combatConditions.length - 1) - leviathan.life) * 18}px`;

    this.game.setTooltip(div.id, this.getTooltip(leviathan));
  }

  public getTooltip(leviathan: AbyssLeviathan): string {

    const guilds = [
      '<span style="color: purple">' + _('Mage') + '</span>',
      '<span style="color: red">' + _('Soldier') + '</span>',
      '<span style="color: #999900">' + _('Farmer') + '</span>',
      '<span style="color: green">' + _('Merchant') + '</span>',
      '<span style="color: blue">' + _('Politician') + '</span>',
    ];
    const factions = [];
    if (leviathan.faction !== null) {
      factions.push(guilds[leviathan.faction]);
    }
    factions.push(guilds[1]);

    let combatConditions = `<table>
    <tr>
      <th>${_('Resistance')}</th>
      <th>${_('Reward if the attack is successful')}</th>
    </tr>`;
    leviathan.combatConditions.forEach((combatCondition, index) => {
      const current = leviathan.life === index;
      combatConditions += `<tr${current ? ' class="current"' : ''}>
        <td>${combatCondition.resistance}</td>
        <td>${combatCondition.reward} <i class="icon icon-monster"></i></td>
      </tr>`;
    });
    combatConditions += '</table>';

    let penalty = '';
    switch (leviathan.penalty) {
      case 1:
        penalty = _('Receive ${number} Wound token(s)');
        break;
      case 2:
        penalty = _('Discard ${number} Pearl(s)');
        break;
      case 3:
        penalty = _('Discard ${number} Allies');
        break;
      case 4:
        penalty = _('Discard ${number} free Lord');
        break;
    }
    penalty = penalty.replace('${number}', `${leviathan.penaltyCount}`);

    return `<div class="abs-tooltip-leviathan">
      <strong>${_('Allied Race(s):')}</strong> ${factions.join(', ')}<br><br>
      <strong>${_('Combat conditions:')}</strong> ${combatConditions}<br><br>
      <strong>${_('Penalty if the Leviathan attacks you:')}</strong> ${penalty}
    </div>`;
  }
}
