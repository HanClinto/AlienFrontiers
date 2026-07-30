import { EventName } from "./constants.js";

export class DockingBay {
  constructor(orbital, index) {
    this.orbital = orbital;
    this.index = index;
    this.dockedShip = null;
  }

  get occupied() {
    return this.dockedShip !== null;
  }

  dockShip(ship) {
    if (this.occupied) {
      throw new Error("Cannot dock a ship in an occupied docking bay");
    }
    ship.undock();
    this.dockedShip = ship;
    ship.dock = this;
    this.orbital.state.postEvent(EventName.shipDocked, ship);
  }

  ejectShip() {
    if (!this.dockedShip) {
      return;
    }
    const ship = this.dockedShip;
    this.dockedShip = null;
    ship.dock = null;
    this.orbital.state.postEvent(EventName.shipDocked, ship);
  }
}

export class Orbital {
  constructor(state, numDockGroups) {
    this.state = state;
    this.docks = Array.from(
      { length: numDockGroups },
      (_, index) => new DockingBay(this, index),
    );
  }

  get firstEmptyDock() {
    return this.docks.find((dock) => !dock.occupied) ?? null;
  }

  get numEmptyGroups() {
    return this.docks.filter((dock) => !dock.occupied).length;
  }

  dockShip(ship) {
    const dock = this.firstEmptyDock;
    if (!dock) {
      throw new Error(`No empty dock at ${this.title}`);
    }
    dock.dockShip(ship);
  }

  finishCommit(selectedShips) {
    for (const ship of selectedShips) {
      if (ship.isSelected) {
        ship.toggleSelect();
      }
    }
    this.state.postEvent(EventName.shipsDocked, this);
    this.state.logMove(
      `${this.state.currentPlayer.playerName}: Docked ${selectedShips.map((ship) => ship.value).join(", ")} at ${this.title}`,
    );
  }
}

export class SolarConverter extends Orbital {
  constructor(state) {
    super(state, state.numPlayers <= 3 ? 7 : 8);
    this.title = "Solar Converter";
  }

  isValidMoveFromPlayer(player, selectedShips) {
    return selectedShips.length > 0 && selectedShips.length <= this.numEmptyGroups;
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    let newFuelTotal = 0;
    for (const ship of selectedShips) {
      const newFuel = Math.ceil(ship.value / 2);
      player.fuel += newFuel;
      newFuelTotal += newFuel;
      this.dockShip(ship);
    }
    this.state.postEvent(EventName.resourcesChanged, player);
    this.finishCommit(selectedShips);
    this.state.logMove(`${player.playerName}: Harvested ${newFuelTotal} fuel`);
    return true;
  }
}

export class MaintenanceBay extends Orbital {
  constructor(state) {
    super(state, state.numPlayers * 6 + 1);
    this.title = "Maintenance Bay";
  }

  isValidMoveFromPlayer(_player, selectedShips) {
    return selectedShips.length > 0;
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    for (const ship of [...selectedShips].sort((left, right) => left.value - right.value)) {
      this.dockShip(ship);
    }
    this.finishCommit(selectedShips);
    return true;
  }
}