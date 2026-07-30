import { EventName } from "./constants.js";
import { Ship } from "./ship.js";

export class Player {
  constructor(state, playerIndex, colorIndex, numPlayers, aiType) {
    this.state = state;
    this.playerIndex = playerIndex;
    this.colorIndex = colorIndex;
    this.aiType = aiType;
    this.fuel = playerIndex === 1 || playerIndex === 3 ? 1 : 0;
    this.ore = playerIndex === 2 || playerIndex === 3 ? 1 : 0;
    this.coloniesLeft = 6 + (4 - numPlayers);
    this.coloniesToLaunch = 0;
    this.marketPrice = 0;
    this.initialRollDone = false;
    this.allShips = Array.from({ length: 6 }, (_, index) => new Ship(this, index));
    this.activeShips = [];
    this.inactiveShips = [...this.allShips];
  }

  get playerName() {
    return `[P${this.playerIndex + 1}]`;
  }

  get selectedShips() {
    return this.activeShips.filter((ship) => ship.isSelected);
  }

  get undockedShips() {
    return this.activeShips.filter((ship) => !ship.docked);
  }

  get numUndockedShips() {
    return this.undockedShips.length;
  }

  get resourcesNeededForNextShip() {
    return this.activeShips.length - 2;
  }

  get ableToMarketTrade() {
    return this.marketPrice > 0 && this.fuel >= this.marketPrice;
  }

  get vps() {
    return this.state.regions.reduce((total, region) => {
      const colonies = region.coloniesForPlayer(this.playerIndex);
      const controlsRegion = region.playerWithMajority === this.playerIndex;
      return total + colonies + (controlsRegion ? 1 : 0)
        + (controlsRegion && region.hasPositronField ? 1 : 0);
    }, 0);
  }

  addColony() {
    this.coloniesToLaunch += 1;
    this.state.postEvent(EventName.launchColony, this);
  }

  setMarketPrice(price) {
    this.marketPrice = price;
    this.state.postEvent(EventName.marketPriceChanged, this);
  }

  doMarketTrade() {
    if (!this.ableToMarketTrade) {
      return false;
    }
    this.fuel -= this.marketPrice;
    this.ore += 1;
    this.state.postEvent(EventName.resourcesChanged, this);
    this.state.logMove(`${this.playerName}: Traded ${this.marketPrice} fuel for 1 ore.`);
    return true;
  }

  activateStartingShips() {
    for (let count = 0; count < 3; count += 1) {
      this.activateShip();
    }
  }

  activateShip() {
    const ship = this.inactiveShips.shift();
    if (!ship) {
      return;
    }
    this.activeShips.push(ship);
    ship.active = true;
    this.state.maintenanceBay.dockShip(ship);
    this.state.postEvent(EventName.shipActivated, ship);
  }

  gatherShips() {
    for (const ship of this.activeShips) {
      ship.undock();
    }
  }

  rollShips(random = Math.random) {
    if (this.initialRollDone) {
      return false;
    }
    for (const ship of this.activeShips) {
      if (!ship.docked && ship.active) {
        ship.roll(random);
      }
    }
    this.state.logMove(`${this.playerName}: Rolled: ${this.activeShips.map((ship) => ship.value).join(", ")}`);
    this.initialRollDone = true;
    this.state.postEvent(EventName.shipsRolled, this);
    return true;
  }

  endTurnCleanup() {
    this.setMarketPrice(0);
    this.initialRollDone = false;
    for (const ship of this.allShips) {
      ship.isSelected = false;
    }
    if (this.ore + this.fuel > 8) {
      this.ore = Math.min(this.ore, 8);
      this.fuel = Math.min(this.fuel, 8 - this.ore);
      this.state.postEvent(EventName.resourcesChanged, this);
    }
  }
}