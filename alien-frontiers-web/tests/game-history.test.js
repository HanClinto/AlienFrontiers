import assert from "node:assert/strict";
import test from "node:test";

import { AIType } from "../js/game/constants.js";
import { GameHistory } from "../js/game/game-history.js";
import { GameState } from "../js/game/game-state.js";

test("undo and redo replace the active state around a facility action", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const history = new GameHistory();
  state.history = history;
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.activeShips[0].value = 4;
  state.toggleShipSelection(player.activeShips[0]);

  assert.equal(state.commitSelectedShips(state.solarConverter), true);
  assert.equal(history.canUndo, true);
  assert.equal(player.fuel, 2);
  assert.equal(player.activeShips[0].dock.orbital, state.solarConverter);

  const undone = history.undo(state);
  assert.equal(undone.currentPlayer.fuel, 0);
  assert.equal(undone.currentPlayer.activeShips[0].docked, false);
  assert.equal(undone.currentPlayer.activeShips[0].isSelected, true);
  assert.equal(history.canUndo, false);
  assert.equal(history.canRedo, true);

  const redone = history.redo(undone);
  assert.equal(redone.currentPlayer.fuel, 2);
  assert.equal(redone.currentPlayer.activeShips[0].dock.orbital, redone.solarConverter);
  assert.equal(history.canUndo, true);
  assert.equal(history.canRedo, false);
});

test("rolling clears undo and redo history", () => {
  const state = new GameState(2, [AIType.human, AIType.human], () => 0.5);
  const history = new GameHistory();
  state.history = history;
  history.createUndoPoint(state);
  assert.equal(history.canUndo, true);
  state.rollCurrentPlayerShips();
  assert.equal(history.canUndo, false);
  assert.equal(history.canRedo, false);
});