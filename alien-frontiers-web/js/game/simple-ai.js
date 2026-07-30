export class SimpleAI {
  static step(state) {
    const player = state.currentPlayer;
    if (!player.initialRollDone) {
      state.rollCurrentPlayerShips();
      return true;
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
}