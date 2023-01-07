
class CompressedLineStock<T> extends ManualPositionStock<T> {

  constructor(
      protected manager: CardManager<T>, 
      protected element: HTMLElement
  ) {
      super(manager, element, undefined, (element: HTMLElement, cards: T[]) => this.manualPosition(element, cards));
  }

  private manualPosition(element: HTMLElement, cards: T[]) {
      const MARGIN = 5;
      const CARD_WIDTH = 85;
      let cardDistance = CARD_WIDTH + MARGIN;
      const containerWidth = element.clientWidth;
      const uncompressedWidth = (cards.length * CARD_WIDTH) + ((cards.length - 1) * MARGIN);
      if (uncompressedWidth > containerWidth) {
          cardDistance = Math.floor(CARD_WIDTH * containerWidth / ((cards.length + 2) * CARD_WIDTH));
      }

      cards.forEach((card, index) => {
          const cardDiv = this.getCardElement(card);
          const cardLeft = cardDistance * index;

          cardDiv.style.left = `${ cardLeft }px`;
      });
  }
}

class LocationManager extends CardManager<AbyssLocation> {
  private static uniqueId: number = 0;

  private lootStocks: CompressedLineStock<AbyssLoot>[] = [];

  constructor(public game: AbyssGame, private lootManager: LootManager) {
    super(game, {
      getId: location => `location-${location.location_id}`,
      setupDiv: (location, div) => {
        const lordHolder = document.createElement('div');
        lordHolder.classList.add('trapped-lords-holder');
        div.prepend(lordHolder);

        div.classList.add(`location`, `location-${location.location_id}`, `board`);
        div.dataset.locationId = `${location.location_id}`;
      },
      setupFrontDiv: (location, div) => {
        var desc = this.makeDesc(location, true);
        div.classList.add(`location-${location.location_id}`);
        div.innerHTML = `
        <div class="location-clicker"></div>
        <span class="location-name">${_(location.name)}</span>
        <span class="location-desc">${desc}</span>
        <div class=""></div>
        `;

        this.game.connectTooltip(div, this.renderTooltip(location), "location" );

        if ([103, 104, 105, 106].includes(location.location_id)) {
          div.insertAdjacentHTML('beforeend', `<div id="loot-stock-${location.location_id}" class="loot-stock"></div>`);

          // TODO GBA replace by compress stock
          this.lootStocks[location.location_id] = new CompressedLineStock<AbyssLoot>(lootManager, document.getElementById(`loot-stock-${location.location_id}`));
          if (location.loots?.length) {
            this.lootStocks[location.location_id].addCards(location.loots);
          }
        }
      },
    });
  }

  makeDesc(location: AbyssLocation, laurel?: boolean): string {
    let pointsReplacement = laurel ? '<i class="icon icon-laurel"></i>' : ' <i class="fa fa-star"></i>';
    // TODO : Wrap points in nobr to avoid line breaks
    var desc = dojo.replace(_(location.desc).replace(/\$/g, pointsReplacement), {
      farmer: '<span style="background-color: rgba(0,0,0,0.7); color: #999900">' + _('Farmer') + '</span>',
      soldier: '<span style="background-color: rgba(0,0,0,0.7); color: red">' + _('Soldier') + '</span>',
      merchant: '<span style="background-color: rgba(0,0,0,0.7); color: green">' + _('Merchant') + '</span>',
      politician: '<span style="background-color: rgba(255,255,255,0.7); color: blue">' + _('Politician') + '</span>',
      mage: '<span style="background-color: rgba(255,255,255,0.7); color: purple">' + _('Mage') + '</span>',
      seahorse: '<span style="background-color: rgba(0,0,0,0.7); color: #999900">' + _('Seahorse') + '</span>',
      crab: '<span style="background-color: rgba(0,0,0,0.7); color: red">' + _('Crab') + '</span>',
      shellfish: '<span style="background-color: rgba(0,0,0,0.7); color: green">' + _('Shellfish') + '</span>',
      squid: '<span style="background-color: rgba(255,255,255,0.7); color: blue">' + _('Squid') + '</span>',
      jellyfish: '<span style="background-color: rgba(255,255,255,0.7); color: purple">' + _('Jellyfish') + '</span>',
    });
    return desc;
  }

  renderTooltip(location: AbyssLocation) {
    var desc = this.makeDesc(location);
    return `<div class="abs-tooltip-location">
      <h3 style="padding-right: 50px;">${_(location.name)}</h3>
      <hr>
      ${desc}
    </div>`;
  }

  public addLoot(locationId: number, loot: AbyssLoot) {
    this.lootStocks[locationId].addCard(loot); // TODO GBA add from element 
  }

  public highlightLootsToDiscard(locationId: number, loots: AbyssLoot[]) {
    loots.forEach(loot => this.lootManager.getCardElement(loot)?.classList.add('selected'));
  }

  public discardLoots(locationId: number, loots: AbyssLoot[]) {
    this.lootStocks[locationId].removeCards(loots);
  }
}
