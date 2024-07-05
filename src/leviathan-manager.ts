class LeviathanManager extends CardManager<AbyssLeviathan> {
  constructor(public game: AbyssGame) {
    super(game, {
      animationManager: game.animationManager,
      getId: leviathan => `leviathan-${leviathan.id}`,
      setupFrontDiv: (leviathan, div: HTMLDivElement) => {
        if (div.classList.contains(`leviathan-card`)) {
          return;
        }
        div.classList.add(`leviathan-card`);

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
  }
}
