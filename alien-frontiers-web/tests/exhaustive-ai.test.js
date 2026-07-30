import assert from "node:assert/strict";
import test from "node:test";

import { AIType } from "../js/game/constants.js";
import { AI_SEARCH_BUDGETS_MS, ExhaustiveAI, evaluateExhaustiveState, exhaustiveStateKey } from "../js/game/exhaustive-ai.js";
import { GameState } from "../js/game/game-state.js";
import { TechCardType } from "../js/game/tech-card.js";
import { createLateGameStressState } from "./fixtures/late-game-state.js";

class FakeWorker {
  constructor(response = null) {
    this.response = response;
    this.listeners = new Map();
    this.terminated = false;
    this.message = null;
  }

  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }

  postMessage(message) {
    this.message = message;
    if (this.response) {
      queueMicrotask(() => this.listeners.get("message")?.({ data: this.response }));
    }
  }

  terminate() {
    this.terminated = true;
  }
}

test("worker search budgets match the original personality timing", () => {
  assert.deepEqual(AI_SEARCH_BUDGETS_MS, {
    [AIType.easy]: 4_400,
    [AIType.medium]: 4_400,
    [AIType.hard]: 7_400,
    [AIType.pirate]: 7_400,
  });
});

test("worker thinking returns a principal variation and terminates cleanly", async () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  const move = { orbitalName: "solarConverter", shipIndexes: [0] };
  const worker = new FakeWorker({
    result: { move, principalVariation: [move], fallbackRequired: false },
  });
  let clearedTimer = null;
  const result = await ExhaustiveAI.think(state, {
    workerFactory: () => worker,
    setTimer: () => 42,
    clearTimer: (timer) => { clearedTimer = timer; },
  });

  assert.deepEqual(result.principalVariation, [move]);
  assert.equal(worker.message.options.timeBudgetMs, 7_400);
  assert.equal(worker.terminated, true);
  assert.equal(clearedTimer, 42);
});

test("worker watchdog and abort terminate safely for fallback", async () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  const watchdogWorker = new FakeWorker();
  let watchdogCallback;
  const watchdogResultPromise = ExhaustiveAI.think(state, {
    workerFactory: () => watchdogWorker,
    setTimer: (callback) => { watchdogCallback = callback; return 1; },
    clearTimer: () => {},
  });
  watchdogCallback();
  const watchdogResult = await watchdogResultPromise;
  assert.equal(watchdogResult.watchdog, true);
  assert.equal(watchdogResult.fallbackRequired, true);
  assert.equal(watchdogWorker.terminated, true);

  const abortWorker = new FakeWorker();
  const controller = new AbortController();
  const abortResultPromise = ExhaustiveAI.think(state, {
    workerFactory: () => abortWorker,
    signal: controller.signal,
    setTimer: () => 2,
    clearTimer: () => {},
  });
  controller.abort();
  const abortResult = await abortResultPromise;
  assert.equal(abortResult.aborted, true);
  assert.equal(abortWorker.terminated, true);

  const alreadyAbortedWorker = new FakeWorker();
  const alreadyAborted = new AbortController();
  alreadyAborted.abort();
  const alreadyAbortedResult = await ExhaustiveAI.think(state, {
    workerFactory: () => alreadyAbortedWorker,
    signal: alreadyAborted.signal,
    setTimer: () => 3,
    clearTimer: () => {},
  });
  assert.equal(alreadyAbortedResult.aborted, true);
  assert.equal(alreadyAbortedWorker.message, null);
  assert.equal(alreadyAbortedWorker.terminated, true);

  const creationFailure = await ExhaustiveAI.think(state, {
    workerFactory: () => { throw new Error("worker unavailable"); },
  });
  assert.equal(creationFailure.fallbackRequired, true);
  assert.equal(creationFailure.error, "worker unavailable");
});

test("state keys ignore logs and history but retain gameplay state", () => {
  const left = new GameState(2, [AIType.hard, AIType.human]);
  const right = new GameState(2, [AIType.hard, AIType.human]);
  left.gameLog.push("different presentation history");
  left.history = { undoSnapshot: { ignored: true } };

  assert.equal(exhaustiveStateKey(left), exhaustiveStateKey(right));
  right.currentPlayer.fuel += 1;
  assert.notEqual(exhaustiveStateKey(left), exhaustiveStateKey(right));
});

test("state keys treat equivalent native dice as fungible", () => {
  const left = new GameState(2, [AIType.hard, AIType.human]);
  const right = new GameState(2, [AIType.hard, AIType.human]);
  for (const state of [left, right]) {
    state.currentPlayer.initialRollDone = true;
    state.currentPlayer.activeShips[0].value = 5;
    state.currentPlayer.activeShips[1].value = 5;
    state.currentPlayer.activeShips[2].value = 2;
  }
  left.solarConverter.commitShipsFromPlayer(left.currentPlayer, [left.currentPlayer.activeShips[0]]);
  right.solarConverter.commitShipsFromPlayer(right.currentPlayer, [right.currentPlayer.activeShips[1]]);

  assert.equal(exhaustiveStateKey(left), exhaustiveStateKey(right));
  right.currentPlayer.activeShips[0].value = 4;
  assert.notEqual(exhaustiveStateKey(left), exhaustiveStateKey(right));
});

test("teleport restrictions disqualify otherwise equivalent dice from fungibility", () => {
  const unrestricted = new GameState(2, [AIType.hard, AIType.human]);
  const restricted = new GameState(2, [AIType.hard, AIType.human]);
  for (const state of [unrestricted, restricted]) {
    state.currentPlayer.initialRollDone = true;
    state.currentPlayer.activeShips[0].value = 5;
    state.currentPlayer.activeShips[1].value = 5;
  }
  restricted.currentPlayer.activeShips[0].teleportRestriction = restricted.solarConverter;

  assert.notEqual(exhaustiveStateKey(unrestricted), exhaustiveStateKey(restricted));

  const sameRestrictionDifferentDie = new GameState(2, [AIType.hard, AIType.human]);
  sameRestrictionDifferentDie.currentPlayer.initialRollDone = true;
  sameRestrictionDifferentDie.currentPlayer.activeShips[0].value = 5;
  sameRestrictionDifferentDie.currentPlayer.activeShips[1].value = 5;
  sameRestrictionDifferentDie.currentPlayer.activeShips[1].teleportRestriction =
    sameRestrictionDifferentDie.solarConverter;
  assert.equal(exhaustiveStateKey(restricted), exhaustiveStateKey(sameRestrictionDifferentDie));
});

test("Artifact ship ownership remains identity-sensitive in state keys", () => {
  const left = new GameState(2, [AIType.hard, AIType.human]);
  const right = new GameState(2, [AIType.hard, AIType.human]);
  for (const [state, ownerIndex] of [[left, 0], [right, 1]]) {
    const owner = state.players[ownerIndex];
    state.burroughsDesert.colonyCounts[ownerIndex] = 1;
    owner.ore = 1;
    owner.fuel = 1;
    state.purchaseArtifactShip(owner);
  }
  assert.notEqual(exhaustiveStateKey(left), exhaustiveStateKey(right));
});

test("evaluator values resources, ships, colonies, and personality aggression", () => {
  const admiralState = new GameState(2, [AIType.hard, AIType.human]);
  const pirateState = new GameState(2, [AIType.pirate, AIType.human]);
  admiralState.currentPlayer.ore = 3;
  pirateState.currentPlayer.ore = 3;
  admiralState.players[1].ore = 5;
  pirateState.players[1].ore = 5;

  const admiralValue = evaluateExhaustiveState(admiralState, 0, () => 0.5);
  const pirateValue = evaluateExhaustiveState(pirateState, 0, () => 0.5);
  assert.ok(pirateValue < admiralValue);

  admiralState.currentPlayer.addColony();
  assert.ok(evaluateExhaustiveState(admiralState, 0, () => 0.5) > admiralValue);
});

test("bounded search deduplicates transpositions and retains their best first move", () => {
  const root = new GameState(2, [AIType.hard, AIType.human]);
  const states = new Map([[0, root]]);
  const stateWithFuel = (fuel) => {
    if (!states.has(fuel)) {
      const state = new GameState(2, [AIType.hard, AIType.human]);
      state.currentPlayer.fuel = fuel;
      states.set(fuel, state);
    }
    return states.get(fuel);
  };
  const graph = new Map([
    [0, [
      { state: stateWithFuel(1), move: "left" },
      { state: stateWithFuel(2), move: "right" },
    ]],
    [1, [{ state: stateWithFuel(3), move: "finish-left" }]],
    [2, [{ state: stateWithFuel(3), move: "finish-right" }]],
    [3, []],
  ]);

  const result = ExhaustiveAI.search(root, {
    generateChildren: (state) => graph.get(state.currentPlayer.fuel) ?? [],
    evaluate: (state) => state.currentPlayer.fuel,
    maxDepth: 3,
    maxNodes: 20,
    beamWidth: 20,
    now: () => 0,
    timeBudgetMs: 100,
  });

  assert.equal(result.move, "right");
  assert.equal(result.score, 3);
  assert.equal(result.uniqueStates, 4);
  assert.equal(result.expandedNodes, 4);
});

test("search obeys node and time budgets and can safely return no move", () => {
  const root = new GameState(2, [AIType.hard, AIType.human]);
  let tick = 0;
  const result = ExhaustiveAI.search(root, {
    generateChildren: (state) => Array.from({ length: 20 }, (_, index) => {
      const child = new GameState(2, [AIType.hard, AIType.human]);
      child.currentPlayer.fuel = state.currentPlayer.fuel + index + 1;
      return { state: child, move: index };
    }),
    evaluate: (state) => state.currentPlayer.fuel,
    maxDepth: 10,
    maxNodes: 5,
    now: () => tick++,
    timeBudgetMs: 100,
  });

  assert.equal(result.expandedNodes, 5);
  assert.equal(result.timedOut, true);

  const noTime = ExhaustiveAI.search(root, {
    generateChildren: () => { throw new Error("must not expand after deadline"); },
    now: () => 10,
    timeBudgetMs: 0,
  });
  assert.equal(noTime.move, null);
  assert.equal(noTime.timedOut, true);
  assert.equal(noTime.fallbackRequired, true);
});

test("timeout returns the best evaluated move even when it scores below doing nothing", () => {
  const root = new GameState(2, [AIType.hard, AIType.human]);
  const child = new GameState(2, [AIType.hard, AIType.human]);
  child.currentPlayer.fuel = 1;
  let tick = 0;
  const result = ExhaustiveAI.search(root, {
    generateChildren: () => [{ state: child, move: "best-effort" }],
    evaluate: (state) => state === root ? 100 : 1,
    now: () => tick++,
    timeBudgetMs: 3,
    maxDepth: 2,
  });

  assert.equal(result.timedOut, true);
  assert.equal(result.move, "best-effort");
  assert.equal(result.fallbackRequired, false);
});

test("orbital generation clones state and removes equivalent die placements early", () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.activeShips[0].value = 2;
  player.activeShips[1].value = 2;
  player.activeShips[2].value = 5;
  const before = exhaustiveStateKey(state);

  const children = ExhaustiveAI.orbitalMoves(state);
  assert.equal(exhaustiveStateKey(state), before);
  assert.ok(children.length > 0);
  assert.equal(children.every(({ state: child }) => child !== state), true);
  const uniqueKeys = new Set(children.map(({ state: child }) => exhaustiveStateKey(child)));
  assert.equal(uniqueKeys.size, children.length);
});

test("orbital generation checks its budget before every clone", () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  state.currentPlayer.initialRollDone = true;
  let checks = 0;
  const children = ExhaustiveAI.orbitalMoves(state, {
    maxChildren: 96,
    shouldContinue: () => checks++ < 2,
  });

  assert.ok(children.length <= 2);
  assert.ok(checks <= 3);
});

test("bounded ExhaustiveAI step executes a selected move and permits fallback", () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.activeShips[0].value = 6;
  player.activeShips[1].value = 2;
  player.activeShips[2].value = 1;

  assert.equal(ExhaustiveAI.step(state, {
    timeBudgetMs: 100,
    maxNodes: 200,
    maxDepth: 2,
    now: () => 0,
  }), true);
  assert.ok(player.numUndockedShips < 3);

  const noBudget = new GameState(2, [AIType.hard, AIType.human]);
  noBudget.currentPlayer.initialRollDone = true;
  assert.equal(ExhaustiveAI.step(noBudget, {
    timeBudgetMs: 0,
    now: () => 1,
  }), false);
});

test("late-game stress fixture exposes dense tech, raid, field, and dice decisions", () => {
  const state = createLateGameStressState();
  const player = state.currentPlayer;
  const card = (type) => player.cards.find((candidate) => candidate.type === type);

  assert.equal(player.activeNativeShips.length, 6);
  assert.equal(player.undockedShips.length, 6);
  assert.equal(player.cards.length, 7);
  assert.ok(player.activeShips.some((ship) => ship.teleportRestriction));
  assert.ok(state.regions.filter((region) => card(TechCardType.dataCrystal).canUsePowerOnRegion(region)).length >= 2);
  assert.ok(state.players.flatMap((candidate) => candidate.activeShips)
    .some((ship) => card(TechCardType.plasmaCannon).canTargetPlasmaShip(ship)));
  player.startRaid();
  const raidableCards = state.players.slice(1).flatMap((candidate) => candidate.cards)
    .filter((candidate) => player.canRaidCard(candidate));
  assert.ok(raidableCards.length >= 3);
  assert.equal(player.cancelRaid(), true);
  assert.equal(state.regions.some((region) => region.hasPositronField), true);
  assert.equal(state.regions.some((region) => region.hasRepulsorField), true);
  assert.equal(state.regions.some((region) => region.hasIsolationField), true);
});

test("late-game anytime search stays bounded and always returns best effort", () => {
  const samples = [];
  for (let run = 0; run < 8; run += 1) {
    const state = createLateGameStressState();
    const started = performance.now();
    const result = ExhaustiveAI.search(state, {
      generateChildren: (candidate, search) => ExhaustiveAI.orbitalMoves(candidate, {
        maxChildren: Math.min(96, search.remainingNodes ?? 96),
        shouldContinue: search.shouldContinue,
      }),
      timeBudgetMs: 20,
      maxNodes: 400,
      maxDepth: 4,
      beamWidth: 20,
      random: state.random,
    });
    samples.push({ elapsed: performance.now() - started, result });
  }

  assert.equal(samples.every(({ result }) => result.move !== null), true);
  assert.equal(samples.every(({ result }) => result.fallbackRequired === false), true);
  assert.equal(samples.every(({ result }) => result.expandedNodes <= 400), true);
  assert.ok(Math.max(...samples.map(({ elapsed }) => elapsed)) < 100);
});
