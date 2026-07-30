import assert from "node:assert/strict";
import test from "node:test";

import { AIType } from "../js/game/constants.js";
import { GameHistory } from "../js/game/game-history.js";
import { GameState } from "../js/game/game-state.js";

test("undo and redo traverse recursive game-state history", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const history = new GameHistory();
  state.history = history;
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.marketPrice = 1;
  player.fuel = 3;

  assert.equal(player.doMarketTrade(), true);
  assert.equal(player.doMarketTrade(), true);
  assert.equal(player.doMarketTrade(), true);
  assert.equal(history.canUndo, true);
  assert.deepEqual([player.fuel, player.ore], [0, 3]);

  const undoneOnce = history.undo(state);
  assert.deepEqual([undoneOnce.currentPlayer.fuel, undoneOnce.currentPlayer.ore], [1, 2]);
  const undoneTwice = history.undo(undoneOnce);
  assert.deepEqual([undoneTwice.currentPlayer.fuel, undoneTwice.currentPlayer.ore], [2, 1]);
  const undoneThrice = history.undo(undoneTwice);
  assert.deepEqual([undoneThrice.currentPlayer.fuel, undoneThrice.currentPlayer.ore], [3, 0]);
  assert.equal(history.canUndo, false);
  assert.equal(history.canRedo, true);

  const redoneOnce = history.redo(undoneThrice);
  assert.deepEqual([redoneOnce.currentPlayer.fuel, redoneOnce.currentPlayer.ore], [2, 1]);
  const redoneTwice = history.redo(redoneOnce);
  assert.deepEqual([redoneTwice.currentPlayer.fuel, redoneTwice.currentPlayer.ore], [1, 2]);
  const redoneThrice = history.redo(redoneTwice);
  assert.deepEqual([redoneThrice.currentPlayer.fuel, redoneThrice.currentPlayer.ore], [0, 3]);
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