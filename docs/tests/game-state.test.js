import assert from "node:assert/strict";
import test from "node:test";

import { AIType } from "../js/game/constants.js";
import { GameState } from "../js/game/game-state.js";

function sequenceRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

test("initializes original player resources, colonies, and starting ships", () => {
  const state = new GameState(4, [AIType.human, AIType.easy, AIType.medium, AIType.hard]);

  assert.deepEqual(
    state.players.map((player) => [player.fuel, player.ore, player.coloniesLeft]),
    [[0, 0, 6], [1, 0, 6], [0, 1, 6], [1, 1, 6]],
  );
  assert.deepEqual(state.players.map((player) => player.activeShips.length), [3, 3, 3, 3]);
  assert.equal(state.players[0].numUndockedShips, 3);
  assert.deepEqual(state.players.slice(1).map((player) => player.numUndockedShips), [0, 0, 0]);
});

test("plays a deterministic turn through original Solar and Maintenance rules", () => {
  const state = new GameState(
    2,
    [AIType.human, AIType.human],
    sequenceRandom([0, 0.2, 0.99]),
  );
  const playerOne = state.currentPlayer;

  assert.equal(state.rollCurrentPlayerShips(), true);
  assert.deepEqual(playerOne.activeShips.map((ship) => ship.value), [1, 2, 6]);
  assert.equal(playerOne.initialRollDone, true);

  state.toggleShipSelection(playerOne.activeShips[0]);
  state.toggleShipSelection(playerOne.activeShips[2]);
  assert.equal(state.commitSelectedShips(state.solarConverter), true);
  assert.equal(playerOne.fuel, 4);
  assert.equal(playerOne.numUndockedShips, 1);
  assert.equal(playerOne.selectedShips.length, 0);

  state.toggleShipSelection(playerOne.activeShips[1]);
  assert.equal(state.commitSelectedShips(state.maintenanceBay), true);
  assert.equal(state.canEndTurn, true);
  assert.equal(state.gotoNextPlayer(), true);

  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.currentPlayer.numUndockedShips, 3);
  assert.equal(state.currentPlayer.initialRollDone, false);
  assert.equal(playerOne.initialRollDone, false);
});