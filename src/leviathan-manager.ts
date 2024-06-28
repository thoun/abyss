class LeviathanManager extends CardManager<AbyssLeviathan> {
  constructor(public game: AbyssGame) {
    super(game, {
      animationManager: game.animationManager,
      getId: leviathan => `leviathan-${leviathan.id}`,
      setupFrontDiv: (leviathan, div) => {
        div.classList.add(`leviathan-card`);
        console.log(leviathan);

        const imagePosition = leviathan.id - 1;
        const image_items_per_row = 5;
        var row = Math.floor(imagePosition / image_items_per_row);
        const xBackgroundPercent = (imagePosition - (row * image_items_per_row)) * 100;
        const yBackgroundPercent = row * 100;
        div.style.backgroundPosition = `-${xBackgroundPercent}% -${yBackgroundPercent}%`;

      },
      isCardVisible: () => true,
      //cardHeight: 358,
      //cardWidth: 550,
      cardHeight: 88,
      cardWidth: 136,
    });
  }
}
