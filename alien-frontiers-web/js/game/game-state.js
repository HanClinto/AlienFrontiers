import { AIType, EventName } from "./constants.js";
import { EventBus } from "./event-bus.js";
import { AlienArtifact, ColonyConstructor, LunarMine, MaintenanceBay, OrbitalMarket, Shipyard, SolarConverter } from "./orbital.js";
import { Player } from "./player.js";
import { Region, REGION_DEFINITIONS } from "./region.js";
import { buildTechDeck, shuffleTechCards } from "./tech-card.js";

export class GameState {
  constructor(numPlayers, playerPersonalities, random = Math.random, cardRandom = () => 0.5) {
    if (numPlayers < 2 || numPlayers > 4) {
      throw new RangeError("Alien Frontiers supports two to four players");
    }
    this.numPlayers = numPlayers;
    this.random = random;
    this.cardRandom = cardRandom;
    this.events = new EventBus();
    this.currentPlayerIndex = 0;
    this.numTurns = 0;
    this.gameLog = [`Began new ${numPlayers} player game`];

    this.players = Array.from(
      { length: numPlayers },
      (_, index) => new Player(this, index, index, numPlayers, playerPersonalities[index]),
    );
    this.regions = REGION_DEFINITIONS.map(([propertyName, title]) => {
      const region = new Region(this, title);
      this[propertyName] = region;
      return region;
    });
    this.solarConverter = new SolarConverter(this);
    this.maintenanceBay = new MaintenanceBay(this);
    this.lunarMine = new LunarMine(this);
    this.shipyard = new Shipyard(this);
    this.orbitalMarket = new OrbitalMarket(this);
    this.colonyConstructor = new ColonyConstructor(this);
    this.alienArtifact = new AlienArtifact(this);

    this.allTech = buildTechDeck(this);
    this.techDrawDeck = shuffleTechCards(this.allTech, this.cardRandom);
    this.techDiscardDeck = [];
    this.techDisplayDeck = [];

    for (const player of this.players) {
      player.activateStartingShips();
      player.addCard(this.drawTechCard());
    }
    this.fillTechDisplayPile();
    this.currentPlayer.gatherShips();
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  get canEndTurn() {
    return this.currentPlayer.initialRollDone
      && this.currentPlayer.numUndockedShips === 0
      && this.currentPlayer.coloniesToLaunch === 0;
  }

  postEvent(name, object) {
    this.events.post(name, object);
    this.events.post(EventName.stateChanged, object);
  }

  logMove(message) {
    this.gameLog.push(message);
  }

  drawTechCard() {
    if (this.techDrawDeck.length === 0 && this.techDiscardDeck.length > 0) {
      this.techDrawDeck = shuffleTechCards(this.techDiscardDeck, this.cardRandom);
      this.techDiscardDeck = [];
    }
    return this.techDrawDeck.pop() ?? null;
  }

  fillTechDisplayPile() {
    while (this.techDisplayDeck.length < 3) {
      const card = this.drawTechCard();
      if (!card) {
        break;
      }
      this.techDisplayDeck.push(card);
    }
    this.postEvent(EventName.techCardsChanged, this);
  }

  discardTechCard(card) {
    card.owner = null;
    if (!this.techDiscardDeck.includes(card)) {
      this.techDiscardDeck.push(card);
    }
    this.postEvent(EventName.techCardsChanged, card);
  }

  rollCurrentPlayerShips() {
    return this.currentPlayer.rollShips(this.random);
  }

  toggleShipSelection(ship) {
    if (
      ship.player !== this.currentPlayer
      || ship.docked
      || !this.currentPlayer.initialRollDone
      || this.currentPlayer.aiType !== AIType.human
    ) {
      return false;
    }
    ship.toggleSelect();
    return true;
  }

  commitSelectedShips(orbital) {
    return orbital.commitShipsFromPlayer(this.currentPlayer, this.currentPlayer.selectedShips);
  }

  selectRegion(region) {
    if (
      !this.regions.includes(region)
      || region.hasRepulsorField
      || this.currentPlayer.coloniesToLaunch <= 0
    ) {
      return false;
    }
    return region.launchColony(this.currentPlayerIndex);
  }

  gotoNextPlayer() {
    if (!this.canEndTurn) {
      return false;
    }
    this.currentPlayer.endTurnCleanup();
    const nextPlayerIndex = (this.currentPlayerIndex + 1) % this.numPlayers;
    if (nextPlayerIndex < this.currentPlayerIndex) {
      this.numTurns += 1;
      this.postEvent(EventName.nextTurn, this);
    }
    this.currentPlayerIndex = nextPlayerIndex;
    this.currentPlayer.gatherShips();
    this.postEvent(EventName.nextPlayer, this);
    return true;
  }
}