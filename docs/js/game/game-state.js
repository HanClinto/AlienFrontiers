import { AIType, EventName } from "./constants.js";
import { EventBus } from "./event-bus.js";
import { LunarMine, MaintenanceBay, Shipyard, SolarConverter } from "./orbital.js";
import { Player } from "./player.js";

export class GameState {
  constructor(numPlayers, playerPersonalities, random = Math.random) {
    if (numPlayers < 2 || numPlayers > 4) {
      throw new RangeError("Alien Frontiers supports two to four players");
    }
    this.numPlayers = numPlayers;
    this.random = random;
    this.events = new EventBus();
    this.currentPlayerIndex = 0;
    this.numTurns = 0;
    this.gameLog = [`Began new ${numPlayers} player game`];

    this.players = Array.from(
      { length: numPlayers },
      (_, index) => new Player(this, index, index, numPlayers, playerPersonalities[index]),
    );
    this.solarConverter = new SolarConverter(this);
    this.maintenanceBay = new MaintenanceBay(this);
    this.lunarMine = new LunarMine(this);
    this.shipyard = new Shipyard(this);

    for (const player of this.players) {
      player.activateStartingShips();
    }
    this.currentPlayer.gatherShips();
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  get canEndTurn() {
    return this.currentPlayer.initialRollDone && this.currentPlayer.numUndockedShips === 0;
  }

  postEvent(name, object) {
    this.events.post(name, object);
    this.events.post(EventName.stateChanged, object);
  }

  logMove(message) {
    this.gameLog.push(message);
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