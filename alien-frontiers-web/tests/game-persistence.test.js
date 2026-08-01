import assert from "node:assert/strict";
import test from "node:test";

import { AIType, EventName } from "../js/game/constants.js";
import {
  createGameSnapshot,
  GamePersistence,
  restoreGameSnapshot,
} from "../js/game/game-persistence.js";
import { GameHistory } from "../js/game/game-history.js";
import { GameState } from "../js/game/game-state.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

test("round-trips a playable game through a versioned snapshot", () => {
  const state = new GameState(3, [AIType.human, AIType.easy, AIType.human]);
  const player = state.currentPlayer;
  player.fuel = 7;
  player.ore = 4;
  player.marketPrice = 2;
  player.initialRollDone = true;
  player.activeShips[0].value = 5;
  state.toggleShipSelection(player.activeShips[0]);
  state.commitSelectedShips(state.solarConverter);
  state.burroughsDesert.colonyCounts[0] = 2;
  state.burroughsDesert.hasPositronField = true;
  state.burroughsDesert.bonusUsedThisTurn = true;
  state.colonistHub.colonyPositions = [2, 0, 1, 0];
  state.colonistHub.advancementThisTurn = 3;
  player.cards[0].tapped = true;
  player.borrowingRegion = state.heinleinPlains;
  assert.equal(state.purchaseArtifactShip(player), true);
  player.activeShips.splice(player.activeShips.indexOf(state.artifactShip), 1);
  player.activeShips.splice(1, 0, state.artifactShip);
  player.allShips.splice(player.allShips.indexOf(state.artifactShip), 1);
  player.allShips.splice(2, 0, state.artifactShip);
  state.currentPlayerIndex = 1;
  state.numTurns = 4;
  state.gameLog.push("Saved checkpoint");

  const snapshot = createGameSnapshot(state);
  const restored = restoreGameSnapshot(snapshot);

  assert.deepEqual(createGameSnapshot(restored), snapshot);
  assert.equal(restored.solarConverter.docks[0].dockedShip.dock.orbital, restored.solarConverter);
  assert.equal(restored.artifactShip.player, restored.players[0]);
  assert.equal(restored.artifactShip.dock.orbital, restored.maintenanceBay);
  assert.equal(restored.players[0].activeShips.indexOf(restored.artifactShip), 1);
  assert.equal(restored.players[0].allShips.indexOf(restored.artifactShip), 2);
  assert.equal(restored.players[0].cards[0].owner, restored.players[0]);
});

test("autosaves state changes and clears completed games", async () => {
  const storage = memoryStorage();
  const persistence = new GamePersistence(storage);
  const state = new GameState(2, [AIType.human, AIType.easy]);
  persistence.bindState(state);
  state.currentPlayer.fuel = 9;
  state.postEvent(EventName.resourcesChanged, state.currentPlayer);
  await Promise.resolve();

  assert.equal(persistence.load().currentPlayer.fuel, 9);
  state.gameOver = true;
  state.postEvent(EventName.gameOver, state);
  await Promise.resolve();
  assert.equal(persistence.load(), null);
});

test("save and resume preserve recursive undo and redo history", () => {
  const storage = memoryStorage();
  const persistence = new GamePersistence(storage);
  const state = new GameState(2, [AIType.human, AIType.human]);
  state.history = new GameHistory();
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.marketPrice = 1;
  player.fuel = 3;
  assert.equal(player.doMarketTrade(), true);
  assert.equal(player.doMarketTrade(), true);
  assert.equal(player.doMarketTrade(), true);
  assert.equal(state.history.canUndo, true);

  assert.equal(persistence.save(state), true);
  const resumed = persistence.load();
  resumed.history = new GameHistory(resumed.savedHistory);
  assert.equal(resumed.history.canUndo, true);
  assert.equal(resumed.history.canRedo, false);

  const undoneOnce = resumed.history.undo(resumed);
  const undoneTwice = resumed.history.undo(undoneOnce);
  assert.deepEqual([undoneTwice.currentPlayer.fuel, undoneTwice.currentPlayer.ore], [2, 1]);
  assert.equal(undoneTwice.history.canUndo, true);
  assert.equal(undoneTwice.history.canRedo, true);
  assert.equal(persistence.save(undoneTwice), true);

  const resumedUndone = persistence.load();
  resumedUndone.history = new GameHistory(resumedUndone.savedHistory);
  assert.equal(resumedUndone.history.canUndo, true);
  assert.equal(resumedUndone.history.canRedo, true);
  const redoneOnce = resumedUndone.history.redo(resumedUndone);
  const redoneTwice = resumedUndone.history.redo(redoneOnce);
  assert.deepEqual([redoneTwice.currentPlayer.fuel, redoneTwice.currentPlayer.ore], [0, 3]);
});

test("loads legacy raw version-one snapshots without history", () => {
  const storage = memoryStorage();
  const state = new GameState(2, [AIType.human, AIType.human]);
  storage.setItem("alien-frontiers:saved-game", JSON.stringify(createGameSnapshot(state)));

  const restored = new GamePersistence(storage).load();
  assert.equal(restored.numPlayers, 2);
  assert.equal(restored.savedHistory, undefined);
});

test("adds appended tech cards beneath the preserved draw order of legacy snapshots", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const snapshot = createGameSnapshot(state);
  snapshot.cards = snapshot.cards.filter((card) => card.cardID < 20);
  snapshot.techDrawDeck = snapshot.techDrawDeck.filter((cardID) => cardID < 20);
  snapshot.techDiscardDeck = snapshot.techDiscardDeck.filter((cardID) => cardID < 20);
  snapshot.techDisplayDeck = snapshot.techDisplayDeck.filter((cardID) => cardID < 20);
  for (const player of snapshot.players) {
    player.cardIDs = player.cardIDs.filter((cardID) => cardID < 20);
    if (player.selectedCard >= 20) {
      player.selectedCard = null;
    }
  }
  const previousNextCardID = snapshot.techDrawDeck.at(-1);

  const restored = restoreGameSnapshot(snapshot);

  assert.deepEqual(restored.techDrawDeck.slice(0, 2).map((card) => card.cardID), [20, 21]);
  assert.equal(restored.techDrawDeck.at(-1).cardID, previousNextCardID);
  assert.equal(new Set([
    ...restored.players.flatMap((player) => player.cards),
    ...restored.techDisplayDeck,
    ...restored.techDiscardDeck,
    ...restored.techDrawDeck,
  ]).size, 22);
});

test("upgrades scalar history from the first version-two save envelope", () => {
  const storage = memoryStorage();
  const state = new GameState(2, [AIType.human, AIType.human]);
  const undoState = createGameSnapshot(state);
  state.currentPlayer.fuel = 2;
  storage.setItem("alien-frontiers:saved-game", JSON.stringify({
    version: 2,
    state: createGameSnapshot(state),
    history: { undoSnapshot: undoState, redoSnapshot: null },
  }));

  const restored = new GamePersistence(storage).load();
  restored.history = new GameHistory(restored.savedHistory);
  assert.equal(restored.history.canUndo, true);
  const undone = restored.history.undo(restored);
  assert.equal(undone.currentPlayer.fuel, 0);
});