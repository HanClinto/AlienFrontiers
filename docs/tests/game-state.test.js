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

test("Lunar Mine enforces opponents' high die and awards one ore per ship", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [playerOne, playerTwo] = state.players;
  const opponentShip = playerTwo.activeShips[0];
  opponentShip.value = 5;
  state.lunarMine.dockShip(opponentShip);

  playerOne.initialRollDone = true;
  playerOne.activeShips[0].value = 4;
  playerOne.activeShips[1].value = 5;
  state.toggleShipSelection(playerOne.activeShips[0]);
  assert.equal(state.commitSelectedShips(state.lunarMine), false);
  playerOne.activeShips[0].toggleSelect();
  state.toggleShipSelection(playerOne.activeShips[1]);
  assert.equal(state.commitSelectedShips(state.lunarMine), true);
  assert.equal(playerOne.ore, 1);
});

test("Shipyard requires a payable pair and activates the next ship", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.fuel = 1;
  player.ore = 1;
  player.initialRollDone = true;
  player.activeShips[0].value = 3;
  player.activeShips[1].value = 3;
  state.toggleShipSelection(player.activeShips[0]);
  state.toggleShipSelection(player.activeShips[1]);

  assert.equal(state.commitSelectedShips(state.shipyard), true);
  assert.equal(player.fuel, 0);
  assert.equal(player.ore, 0);
  assert.equal(player.activeShips.length, 4);
  assert.equal(player.activeShips[3].docked, true);
  assert.equal(player.activeShips[3].dock.orbital, state.maintenanceBay);
  assert.deepEqual(state.shipyard.docks.map((dock) => dock.dockedShip?.value), [3, 3]);
});