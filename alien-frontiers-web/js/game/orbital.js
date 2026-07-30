import { AIType, EventName } from "./constants.js";

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

export class DockGroup {
  constructor(orbital, numDocks, groupIndex) {
    this.orbital = orbital;
    this.docks = Array.from(
      { length: numDocks },
      (_, index) => new DockingBay(orbital, numDocks * groupIndex + index),
    );
  }

  get empty() {
    return this.docks.every((dock) => !dock.occupied);
  }

  get nextOpenDock() {
    return this.docks.find((dock) => !dock.occupied) ?? null;
  }

  get numOpenDocks() {
    return this.docks.filter((dock) => !dock.occupied).length;
  }

  dockShips(ships) {
    for (const ship of [...ships].sort((left, right) => left.value - right.value)) {
      const dock = this.nextOpenDock;
      if (!dock) {
        throw new Error("Not enough open docks in group");
      }
      dock.dockShip(ship);
    }
  }
}

export class Orbital {
  constructor(state, numDockGroups, numDocksPerGroup = 1) {
    this.state = state;
    this.dockGroups = Array.from(
      { length: numDockGroups },
      (_, index) => new DockGroup(this, numDocksPerGroup, index),
    );
    this.docks = this.dockGroups.flatMap((group) => group.docks);
  }

  get firstEmptyGroup() {
    return this.dockGroups.find((group) => group.empty) ?? null;
  }

  get numEmptyGroups() {
    return this.dockGroups.filter((group) => group.empty).length;
  }

  dockShip(ship) {
    const dock = this.firstEmptyGroup?.nextOpenDock;
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

export class LunarMine extends Orbital {
  constructor(state) {
    const numGroups = state.numPlayers <= 2 ? 3 : state.numPlayers <= 3 ? 4 : 5;
    super(state, numGroups);
    this.title = "Lunar Mine";
  }

  maxValueNotFromPlayer(player) {
    let maxValue = 1;
    for (const dock of this.docks) {
      if (dock.occupied && dock.dockedShip.player !== player) {
        maxValue = Math.max(maxValue, dock.dockedShip.value);
      }
    }
    return maxValue;
  }

  isValidMoveFromPlayer(player, selectedShips) {
    const comparisonPlayer = player.aiType === AIType.human ? player : null;
    const minimumValue = this.maxValueNotFromPlayer(comparisonPlayer);
    return selectedShips.length > 0
      && selectedShips.length <= this.numEmptyGroups
      && selectedShips.every((ship) => ship.value >= minimumValue);
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    for (const ship of [...selectedShips].sort((left, right) => left.value - right.value)) {
      player.ore += 1;
      this.dockShip(ship);
    }
    this.state.postEvent(EventName.resourcesChanged, player);
    this.finishCommit(selectedShips);
    this.state.logMove(`${player.playerName}: Harvested ${selectedShips.length} ore`);
    return true;
  }
}

export class Shipyard extends Orbital {
  constructor(state) {
    const numGroups = state.numPlayers <= 2 ? 1 : state.numPlayers <= 3 ? 2 : 3;
    super(state, numGroups, 2);
    this.title = "Shipyard";
  }

  isValidMoveFromPlayer(player, selectedShips) {
    const needed = player.resourcesNeededForNextShip;
    return this.numEmptyGroups > 0
      && selectedShips.length === 2
      && selectedShips[0].value === selectedShips[1].value
      && player.fuel >= needed
      && player.ore >= needed
      && player.activeShips.length < 6;
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    const needed = player.resourcesNeededForNextShip;
    player.fuel -= needed;
    player.ore -= needed;
    player.activateShip();
    this.firstEmptyGroup.dockShips(selectedShips);
    this.state.postEvent(EventName.resourcesChanged, player);
    this.finishCommit(selectedShips);
    return true;
  }
}

export class OrbitalMarket extends Orbital {
  constructor(state) {
    super(state, state.numPlayers <= 3 ? 1 : 2, 2);
    this.title = "Orbital Market";
  }

  isValidMoveFromPlayer(_player, selectedShips) {
    return this.numEmptyGroups > 0
      && selectedShips.length === 2
      && selectedShips[0].value === selectedShips[1].value;
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    player.setMarketPrice(selectedShips[0].value);
    this.firstEmptyGroup.dockShips(selectedShips);
    this.finishCommit(selectedShips);
    return true;
  }
}

export class ColonyConstructor extends Orbital {
  constructor(state) {
    super(state, state.numPlayers <= 2 ? 1 : 2, 3);
    this.title = "Colony Constructor";
  }

  oreCostForPlayer(player) {
    return this.state.bradburyPlateau.playerHasBonus(player) ? 2 : 3;
  }

  isValidMoveFromPlayer(player, selectedShips) {
    return this.numEmptyGroups > 0
      && selectedShips.length === 3
      && selectedShips.every((ship) => ship.value === selectedShips[0].value)
      && player.ore >= this.oreCostForPlayer(player);
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    player.ore -= this.oreCostForPlayer(player);
    player.addColony();
    this.firstEmptyGroup.dockShips(selectedShips);
    this.state.postEvent(EventName.resourcesChanged, player);
    this.finishCommit(selectedShips);
    return true;
  }
}

export class AlienArtifact extends Orbital {
  constructor(state) {
    super(state, 4);
    this.title = "Alien Artifact";
  }

  isValidMoveFromPlayer(_player, selectedShips) {
    return selectedShips.length > 0 && selectedShips.length <= this.numEmptyGroups;
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    for (const ship of selectedShips) {
      player.artifactCreditAvailable += ship.value;
      player.artifactShufflesAvailable += 1;
      this.dockShip(ship);
    }
    this.finishCommit(selectedShips);
    this.state.postEvent(EventName.techCardsChanged, player);
    return true;
  }
}

export class RaidersOutpost extends Orbital {
  constructor(state) {
    super(state, 1, 3);
    this.title = "Raiders' Outpost";
  }

  isValidMoveFromPlayer(_player, selectedShips) {
    if (selectedShips.length !== 3) {
      return false;
    }
    const values = selectedShips.map((ship) => ship.value).sort((left, right) => left - right);
    const isStraight = values[1] === values[0] + 1 && values[2] === values[1] + 1;
    const dockedTotal = this.docks.reduce(
      (total, dock) => total + (dock.dockedShip?.value ?? 0),
      0,
    );
    return isStraight && values.reduce((total, value) => total + value, 0) > dockedTotal;
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    const incumbents = this.docks
      .map((dock) => dock.dockedShip)
      .filter(Boolean);
    for (const ship of incumbents) {
      this.state.maintenanceBay.dockShip(ship);
    }
    this.firstEmptyGroup.dockShips(selectedShips);
    player.startRaid();
    this.finishCommit(selectedShips);
    return true;
  }
}

export class ColonistHub extends Orbital {
  constructor(state) {
    super(state, state.numPlayers, 3);
    this.title = "Colonist Hub";
    this.colonyPositions = [0, 0, 0, 0];
    this.advancementThisTurn = 0;
  }

  colonyPosition(playerIndex) {
    return this.colonyPositions[playerIndex];
  }

  isValidMoveFromPlayer(player, selectedShips) {
    const playerDocks = this.dockGroups[player.playerIndex];
    return selectedShips.length > 0
      && playerDocks.numOpenDocks >= selectedShips.length
      && this.colonyPosition(player.playerIndex) < 7;
  }

  commitShipsFromPlayer(player, selectedShips) {
    if (!this.isValidMoveFromPlayer(player, selectedShips)) {
      return false;
    }
    let advancement = selectedShips.length;
    if (
      this.advancementThisTurn + advancement >= 2
      && this.state.asimovCrater.playerHasBonus(player)
      && !this.state.asimovCrater.bonusUsedThisTurn
    ) {
      this.state.asimovCrater.bonusUsedThisTurn = true;
      advancement += 1;
    }
    this.advancementThisTurn += advancement;
    this.colonyPositions[player.playerIndex] += advancement;
    this.dockGroups[player.playerIndex].dockShips(selectedShips);
    this.finishCommit(selectedShips);
    return true;
  }

  ableToLaunch(player) {
    return this.colonyPosition(player.playerIndex) >= 7
      && player.ore >= 1
      && player.fuel >= 1;
  }

  launchColony(player) {
    if (!this.ableToLaunch(player)) {
      return false;
    }
    player.ore -= 1;
    player.fuel -= 1;
    this.colonyPositions[player.playerIndex] -= 7;
    player.addColony();
    this.state.postEvent(EventName.resourcesChanged, player);
    return true;
  }
}