class LocationManager extends CardManager<AbyssLocation> {
  private static uniqueId: number = 0;

  constructor(public game: AbyssGame) {
    super(game, {
      getId: location => location.location_id,
      setupDiv: (location, div) => {
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
        <div class="trapped-lords-holder"></div>
        `;
      },
    });
  }

  makeDesc(location: AbyssLocation, laurel?) {
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

  render(location: AbyssLocation) {
    var desc = this.makeDesc(location, true);

    return `<div id="location-uid-${++LocationManager.uniqueId}" class="location board location-${location.location_id}" data-location-id="${location.location_id}">
      <div class="location-clicker"></div>
      <span class="location-name">${_(location.name)}</span>
      <span class="location-desc">${desc}</span>
      <div class="trapped-lords-holder"></div>
    </div>`;
  }

  placeLords(locationNode, lords: AbyssLord[]) {
    for (let i in lords) {
      let lord = lords[i];
      let parent = dojo.query('.trapped-lords-holder', locationNode)[0];
      this.game.lordManager.placeWithTooltip(lord, parent);
    }
  }

  organisePlayerBoard(player_id) {
    // playerboard .locations:
    //     pairs go into .locations-row (padding-top: 50px)
    //     two locations (note, locations no longer have the padding top!)
    var locations = [];
    dojo.query('#player-panel-' + player_id + ' .locations .location').forEach(node => {
      locations.push(node);
      node.parentNode.removeChild(node);
    });
    dojo.query('#player-panel-' + player_id + ' .locations .locations-row').forEach(node => dojo.destroy(node));
    var locations_holder = dojo.query('#player-panel-' + player_id + ' .locations')[0];
    var num_rows = Math.ceil(locations.length / 2);
    for (var i = 0; i < num_rows; i++) {
      var row = dojo.place('<div class="locations-row"></div>', locations_holder);
      dojo.place(locations.shift(), row);
      if (locations.length > 0)
        dojo.place(locations.shift(), row);
    }
  }

  renderTooltip(location: AbyssLocation) {
    var desc = this.makeDesc(location);
    return `<div class="abs-tooltip-location">
      <h3 style="padding-right: 50px;">${_(location.name)}</h3>
      <hr>
      ${desc}
    </div>`;
  }

  placeWithTooltip(location: AbyssLocation, parent) {
    let node = dojo.place( this.render(location), parent );
    this.game.connectTooltip( node, this.renderTooltip(location), "location" );
    if (parent?.id == 'locations-holder') {
      this.organise();
    }
    return node;
  }

  organise() {
    // First, move all in overflow back to holder
    let overflowLocations = dojo.query('.location:not(.location-back)', $('locations-holder-overflow'));
    for (let i = 0; i < overflowLocations.length; i++) {
      $('locations-holder').appendChild(overflowLocations[i]);
    }
    
    // If on playmat:
    if (dojo.hasClass($('game-board-holder'), "playmat")) {
      // Then, move all beyond 5 into the overflow
      let locations = dojo.query('.location:not(.location-back)', $('locations-holder'));
      if (locations.length > 5) {
        for (let i = 5; i < locations.length; i++) {
          // move to overflow...
          $('locations-holder-overflow').appendChild(locations[i]);
        }
      }
    }
  }
}
