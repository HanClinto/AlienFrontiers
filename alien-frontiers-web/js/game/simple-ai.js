export class SimpleAI {
  static step(state) {
    const player = state.currentPlayer;
    if (!player.initialRollDone) {
      state.rollCurrentPlayerShips();
      return true;
    }

    if (player.coloniesToLaunch > 0) {
      return this.launchColony(state, player);
    }

    if (player.numUndockedShips === 0) {
      return state.gotoNextPlayer();
    }

    const shipsByValue = new Map();
    for (const ship of player.undockedShips) {
      const matchingShips = shipsByValue.get(ship.value) ?? [];
      matchingShips.push(ship);
      shipsByValue.set(ship.value, matchingShips);
    }
    const constructorTriplet = [...shipsByValue.values()].find((ships) =>
      ships.length >= 3
      && state.colonyConstructor.isValidMoveFromPlayer(player, ships.slice(0, 3)));
    if (constructorTriplet) {
      state.colonyConstructor.commitShipsFromPlayer(player, constructorTriplet.slice(0, 3));
      this.launchColony(state, player);
      return true;
    }
    const shipyardPair = [...shipsByValue.values()].find((ships) =>
      ships.length >= 2 && state.shipyard.isValidMoveFromPlayer(player, ships.slice(0, 2)));
    if (shipyardPair) {
      state.shipyard.commitShipsFromPlayer(player, shipyardPair.slice(0, 2));
      return true;
    }

    const lunarShips = [...player.undockedShips]
      .sort((left, right) => left.value - right.value)
      .filter((ship) => state.lunarMine.isValidMoveFromPlayer(player, [ship]));
    if (player.ore < 3 && player.ore <= player.fuel && lunarShips.length > 0) {
      state.lunarMine.commitShipsFromPlayer(player, [lunarShips[0]]);
      return true;
    }

    if (player.fuel < 3 && player.undockedShips.length > 0) {
      const highestShip = [...player.undockedShips]
        .sort((left, right) => right.value - left.value)[0];
      state.solarConverter.commitShipsFromPlayer(player, [highestShip]);
      return true;
    }

    state.maintenanceBay.commitShipsFromPlayer(player, player.undockedShips);
    return true;
  }

  static launchColony(state, player) {
    const legalRegions = state.regions.filter((region) => !region.hasRepulsorField);
    const needs = legalRegions.map((region) => ({
      region,
      coloniesNeeded: region.coloniesNeededForMajority(player),
    }));
    const choice = needs.find(({ coloniesNeeded }) => coloniesNeeded === 1)
      ?? needs.find(({ coloniesNeeded }) => coloniesNeeded === 2)
      ?? needs.find(({ coloniesNeeded }) => coloniesNeeded === 0)
      ?? [...needs].sort((left, right) => left.coloniesNeeded - right.coloniesNeeded)[0];
    return choice ? state.selectRegion(choice.region) : false;
  }
}