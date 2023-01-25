{OVERALL_GAME_HEADER}

<div id="game-holder">
  <div id="last-round" style="display: none"></div>
  <div id="game-scoring">
    <table>
      <tr id="scoring-row-players" class="line-below">
        <td class="first-column"></td>
      </tr>
      <tr id="scoring-row-location">
        <td class="first-column"><span class="arrow">→</span><i id="scoring-location-icon" class="icon icon-location"></i></td>
      </tr>
      <tr id="scoring-row-lord">
        <td class="first-column"><span class="arrow">→</span><i id="scoring-lords-icon" class="icon icon-lord"></i></td>
      </tr>
      <tr id="scoring-row-affiliated">
        <td class="first-column"><span class="arrow">→</span><i id="scoring-affiliated-icon" class="icon icon-affiliated-ally"></i></td>
      </tr>
      <tr id="scoring-row-monster">
        <td class="first-column"><span class="arrow">→</span><i id="scoring-monster-tokens-icon" class="icon icon-monster"></i></td>
      </tr>
      <tr id="scoring-row-total" class="line-above">
        <td id="text-total" class="first-column"></td>
      </tr>
    </table>
  </div>
  <div id="table">
    <div id="centered-table">
      <div id="game-extra" class="whiteblock" style="display: none;"></div>
      <div id="game-board-holder">
        <div id="game-board" class="board">
          <div id="council-track">
            <div id="council-track-0" class="ally ally-side ally-back slot-0 deck-empty" data-faction="0">
              <span class="deck-size"></span>
            </div>
            <div id="council-track-1" class="ally ally-side ally-back slot-1 deck-empty" data-faction="1">
              <span class="deck-size"></span>
            </div>
            <div id="council-track-2" class="ally ally-side ally-back slot-2 deck-empty" data-faction="2">
              <span class="deck-size"></span>
            </div>
            <div id="council-track-3" class="ally ally-side ally-back slot-3 deck-empty" data-faction="3">
              <span class="deck-size"></span>
            </div>
            <div id="council-track-4" class="ally ally-side ally-back slot-4 deck-empty" data-faction="4">
              <span class="deck-size"></span>
            </div>
          </div>
          <div id="explore-track">
            <span id="ally-discard-size" class="deck-size"></span>
            <div class="ally ally-side ally-back slot-0 slot-fake">
            </div>
            <div id="explore-track-deck" class="ally ally-side ally-back slot-0 deck-full">
              <span class="deck-size"></span>
            </div>
            <div id="visible-allies-stock"></div>
          </div>
          <div id="lords-track">
            <div class="lord lord-side lord-back slot-0 deck-full">
              <span class="deck-size"></span>
            </div>
            <div id="visible-lords-stock"></div>
            <div id="bonus-pearls-holder">
              <i class="icon icon-pearl"></i>
              <i class="icon icon-pearl"></i>
            </div>
          </div>
        </div>
        <hr>
        <div id="threat-track" class="board">
          <div id="threat-token" class="icon threat-token slot-0 transition-position"></div>
        </div>
        <div id="locations-holder-holder" class="board">
          <div id="locations-holder" class="board">
            <div class="location location-side board location-back">
              <span class="deck-size"></span>
            </div>
            <div id="visible-locations-stock">
            </div>
          </div>
        </div>
      </div>
      <div id="locations-holder-overflow">
      </div>
      <div style="display: none"><input id="modified-layout-checkbox" type="checkbox" checked> Modified layout</div>
      <div id="player-panel-holder">
      </div>
      </div>
    </div>
  </div>
</div>

<div id="gameplay-options">
  <b id="option-desc"></b>
  <br>
  <table>
    <tr>
      <td>&nbsp;</td>
      <td>0</td>
      <td>1</td>
      <td>2</td>
      <td>3</td>
      <td>4</td>
      <td>5</td>
    </tr>
    <tr>
      <td id="option-all">All</td>
      <td><input id="autopass-all-0" type="radio"></td>
      <td><input id="autopass-all-1" type="radio"></td>
      <td><input id="autopass-all-2" type="radio"></td>
      <td><input id="autopass-all-3" type="radio"></td>
      <td><input id="autopass-all-4" type="radio"></td>
      <td><input id="autopass-all-5" type="radio"></td>
    </tr>
    <tr>
      <td style="color: purple" id="option-jellyfish"></td>
      <td><input id="autopass-0-0" type="radio"></td>
      <td><input id="autopass-0-1" type="radio"></td>
      <td><input id="autopass-0-2" type="radio"></td>
      <td><input id="autopass-0-3" type="radio"></td>
      <td><input id="autopass-0-4" type="radio"></td>
      <td><input id="autopass-0-5" type="radio"></td>
    </tr>
    <tr>
      <td style="color: red" id="option-crab"></td>
      <td><input id="autopass-1-0" type="radio"></td>
      <td><input id="autopass-1-1" type="radio"></td>
      <td><input id="autopass-1-2" type="radio"></td>
      <td><input id="autopass-1-3" type="radio"></td>
      <td><input id="autopass-1-4" type="radio"></td>
      <td><input id="autopass-1-5" type="radio"></td>
    </tr>
    <tr>
      <td style="color: #999900" id="option-seahorse"></td>
      <td><input id="autopass-2-0" type="radio"></td>
      <td><input id="autopass-2-1" type="radio"></td>
      <td><input id="autopass-2-2" type="radio"></td>
      <td><input id="autopass-2-3" type="radio"></td>
      <td><input id="autopass-2-4" type="radio"></td>
      <td><input id="autopass-2-5" type="radio"></td>
    </tr>
    <tr>
      <td style="color: green" id="option-shellfish"></td>
      <td><input id="autopass-3-0" type="radio"></td>
      <td><input id="autopass-3-1" type="radio"></td>
      <td><input id="autopass-3-2" type="radio"></td>
      <td><input id="autopass-3-3" type="radio"></td>
      <td><input id="autopass-3-4" type="radio"></td>
      <td><input id="autopass-3-5" type="radio"></td>
    </tr>
    <tr>
      <td style="color: blue" id="option-squid"></td>
      <td><input id="autopass-4-0" type="radio"></td>
      <td><input id="autopass-4-1" type="radio"></td>
      <td><input id="autopass-4-2" type="radio"></td>
      <td><input id="autopass-4-3" type="radio"></td>
      <td><input id="autopass-4-4" type="radio"></td>
      <td><input id="autopass-4-5" type="radio"></td>
    </tr>
  </table>
</div>

{OVERALL_GAME_FOOTER}
