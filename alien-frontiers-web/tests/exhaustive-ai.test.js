import assert from "node:assert/strict";
import test from "node:test";

import { AIType } from "../js/game/constants.js";
import { AI_SEARCH_BUDGETS_MS, ExhaustiveAI, LEGACY_COMPACT_PROFILES, evaluateExhaustiveState, evaluateLegacyParityState, exhaustivePositionKey, exhaustivePositionKeysEqual, exhaustiveStateKey } from "../js/game/exhaustive-ai.js";
import { GameState } from "../js/game/game-state.js";
import { runExhaustiveWorkerSearch } from "../js/game/exhaustive-ai-worker-search.js";
import { createGameSnapshot, restoreGameSnapshotInto } from "../js/game/game-persistence.js";
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
  assert.equal(LEGACY_COMPACT_PROFILES.desktop.maxNodes, 12_800);
  assert.equal(LEGACY_COMPACT_PROFILES.mobile.maxNodes, 6_400);
  const pirate = new GameState(2, [AIType.pirate, AIType.human]);
  assert.deepEqual(ExhaustiveAI.legacyCompactOptionsFor(pirate, "desktop"), {
    policy: "legacy-compact",
    maxNodes: 12_800,
    maxDepth: 100,
    maxChildren: 800,
    timeBudgetMs: 7_400,
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

test("worker contract forwards LegacyCompact policy and matches in-process search", async () => {
  const state = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  state.currentPlayer.initialRollDone = true;
  [1, 2, 3].forEach((value, index) => {
    state.currentPlayer.activeShips[index].value = value;
  });
  const options = {
    policy: "legacy-compact",
    timeBudgetMs: Number.POSITIVE_INFINITY,
    maxNodes: 300,
    maxDepth: 5,
    maxChildren: 64,
  };
  const expected = ExhaustiveAI.searchLegacyCompact(state, {
    ...options,
    now: () => 0,
  });
  const actual = runExhaustiveWorkerSearch(createGameSnapshot(state), options);
  assert.deepEqual(actual.move, expected.move);
  assert.equal(actual.score, expected.score);
  assert.equal(actual.completedDepth, expected.completedDepth);
  assert.equal(actual.uniqueStates, expected.uniqueStates);

  const worker = new FakeWorker({ result: expected });
  await ExhaustiveAI.think(state, {
    ...options,
    workerFactory: () => worker,
    setTimer: () => 42,
    clearTimer: () => {},
  });
  assert.equal(worker.message.options.policy, "legacy-compact");
  assert.equal(worker.message.options.maxNodes, 300);
  assert.equal(worker.message.options.maxChildren, 64);
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

test("numeric position keys ignore presentation state and retain gameplay state", () => {
  const left = createLateGameStressState();
  const right = createLateGameStressState();
  left.gameLog.push("different presentation history");
  assert.equal(exhaustivePositionKeysEqual(
    exhaustivePositionKey(left),
    exhaustivePositionKey(right),
  ), true);
  right.currentPlayer.fuel += 1;
  assert.equal(exhaustivePositionKeysEqual(
    exhaustivePositionKey(left),
    exhaustivePositionKey(right),
  ), false);
});

test("snapshots can restore repeatedly into one reusable state without stale data", () => {
  const target = new GameState(4, [AIType.easy, AIType.easy, AIType.easy, AIType.easy]);
  const lateGame = createLateGameStressState(AIType.pirate);
  restoreGameSnapshotInto(target, createGameSnapshot(lateGame), () => 0.25, () => 0.75);
  assert.deepEqual(createGameSnapshot(target), createGameSnapshot(lateGame));

  const freshGame = new GameState(
    4,
    [AIType.medium, AIType.hard, AIType.pirate, AIType.easy],
    () => 0.5,
    () => 0.5,
  );
  restoreGameSnapshotInto(target, createGameSnapshot(freshGame), () => 0.5, () => 0.5);
  assert.deepEqual(createGameSnapshot(target), createGameSnapshot(freshGame));
  assert.ok(target.players.every((player) => !player.isRaiding && player.cardToRaid === null));
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
  assert.equal(exhaustivePositionKeysEqual(
    exhaustivePositionKey(left),
    exhaustivePositionKey(right),
  ), true);
  right.currentPlayer.activeShips[0].value = 4;
  assert.notEqual(exhaustiveStateKey(left), exhaustiveStateKey(right));
  assert.equal(exhaustivePositionKeysEqual(
    exhaustivePositionKey(left),
    exhaustivePositionKey(right),
  ), false);
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
  assert.equal(exhaustivePositionKeysEqual(
    exhaustivePositionKey(unrestricted),
    exhaustivePositionKey(restricted),
  ), false);

  const sameRestrictionDifferentDie = new GameState(2, [AIType.hard, AIType.human]);
  sameRestrictionDifferentDie.currentPlayer.initialRollDone = true;
  sameRestrictionDifferentDie.currentPlayer.activeShips[0].value = 5;
  sameRestrictionDifferentDie.currentPlayer.activeShips[1].value = 5;
  sameRestrictionDifferentDie.currentPlayer.activeShips[1].teleportRestriction =
    sameRestrictionDifferentDie.solarConverter;
  assert.equal(exhaustiveStateKey(restricted), exhaustiveStateKey(sameRestrictionDifferentDie));
  assert.equal(exhaustivePositionKeysEqual(
    exhaustivePositionKey(restricted),
    exhaustivePositionKey(sameRestrictionDifferentDie),
  ), true);
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
  assert.equal(exhaustivePositionKeysEqual(
    exhaustivePositionKey(left),
    exhaustivePositionKey(right),
  ), false);
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

test("evaluator includes original region bonus weights and Isolation blocking", () => {
  const controlled = new GameState(2, [AIType.hard, AIType.human]);
  const isolated = new GameState(2, [AIType.hard, AIType.human]);
  controlled.lemBadlands.colonyCounts[0] = 1;
  isolated.lemBadlands.colonyCounts[0] = 1;
  isolated.lemBadlands.hasIsolationField = true;

  const controlledValue = evaluateExhaustiveState(controlled, 0, () => 0.5);
  const isolatedValue = evaluateExhaustiveState(isolated, 0, () => 0.5);
  assert.ok(controlledValue > isolatedValue);

  const herbert = new GameState(2, [AIType.hard, AIType.human]);
  herbert.herbertValley.colonyCounts[0] = 1;
  assert.ok(evaluateExhaustiveState(herbert, 0, () => 0.5)
    > evaluateExhaustiveState(new GameState(2, [AIType.hard, AIType.human]), 0, () => 0.5));
});

test("legacy evaluator preserves the highest die on Lunar Mine", () => {
  const highLunar = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  const lowLunar = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  for (const state of [highLunar, lowLunar]) {
    state.currentPlayer.initialRollDone = true;
    [6, 6, 5].forEach((value, index) => {
      state.currentPlayer.activeShips[index].value = value;
    });
  }
  highLunar.lunarMine.commitShipsFromPlayer(highLunar.currentPlayer, [
    highLunar.currentPlayer.activeShips[0],
  ]);
  highLunar.alienArtifact.commitShipsFromPlayer(highLunar.currentPlayer, [
    highLunar.currentPlayer.activeShips[1],
    highLunar.currentPlayer.activeShips[2],
  ]);
  lowLunar.lunarMine.commitShipsFromPlayer(lowLunar.currentPlayer, [
    lowLunar.currentPlayer.activeShips[2],
  ]);
  lowLunar.alienArtifact.commitShipsFromPlayer(lowLunar.currentPlayer, [
    lowLunar.currentPlayer.activeShips[0],
    lowLunar.currentPlayer.activeShips[1],
  ]);

  assert.ok(evaluateLegacyParityState(highLunar, 0) > evaluateLegacyParityState(lowLunar, 0));
});

test("legacy evaluator restores original personality and card-value semantics", () => {
  const marginalCardValue = (aiType) => {
    const state = new GameState(2, [aiType, AIType.human], () => 0.5, () => 0.5);
    state.currentPlayer.cards = [];
    const withoutCard = evaluateLegacyParityState(state, 0);
    const card = state.allTech.find((candidate) => candidate.type === TechCardType.gravityManipulator);
    state.currentPlayer.cards = [card];
    card.owner = state.currentPlayer;
    return evaluateLegacyParityState(state, 0) - withoutCard;
  };
  assert.ok(marginalCardValue(AIType.medium) > marginalCardValue(AIType.easy));

  const cacheState = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  const cache = cacheState.allTech.find((card) => card.type === TechCardType.resourceCache);
  cacheState.currentPlayer.cards = [cache];
  cache.owner = cacheState.currentPlayer;
  const earlyCacheValue = evaluateLegacyParityState(cacheState, 0);
  cacheState.players[1].coloniesLeft = 1;
  const lateCacheValue = evaluateLegacyParityState(cacheState, 0);
  assert.ok(earlyCacheValue > lateCacheValue);
});

test("legacy evaluator excludes borrowed region control and Artifact Terraforming liability", () => {
  const borrowed = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  const neutral = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  borrowed.currentPlayer.borrowingRegion = borrowed.herbertValley;
  assert.equal(evaluateLegacyParityState(borrowed, 0), evaluateLegacyParityState(neutral, 0));

  const artifact = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  artifact.burroughsDesert.colonyCounts[0] = 1;
  artifact.currentPlayer.ore = 2;
  artifact.currentPlayer.fuel = 2;
  artifact.purchaseArtifactShip(artifact.currentPlayer);
  artifact.artifactShip.value = 6;
  const activeValue = evaluateLegacyParityState(artifact, 0);
  artifact.artifactShip.undock();
  artifact.terraformingStation.commitShipsFromPlayer(artifact.currentPlayer, [artifact.artifactShip]);
  const terraformingValue = evaluateLegacyParityState(artifact, 0);
  assert.ok(terraformingValue > activeValue - 11);
});

test("legacy evaluator uses the original terminal value", () => {
  const state = new GameState(2, [AIType.hard, AIType.hard], () => 0.5, () => 0.5);
  state.heinleinPlains.colonyCounts[0] = 1;
  state.currentPlayer.coloniesLeft = 0;
  state.checkGameOver();
  assert.equal(evaluateLegacyParityState(state, 0), 1_497);
  assert.equal(evaluateLegacyParityState(state, 1), -1_500);
});

test("LegacyCompact uses a six on Lunar Mine before spending six-five at Artifact", () => {
  const state = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  state.currentPlayer.initialRollDone = true;
  [6, 6, 5].forEach((value, index) => {
    state.currentPlayer.activeShips[index].value = value;
  });

  const lunar = ExhaustiveAI.searchLegacyCompact(state, {
    maxNodes: 12_800,
    maxDepth: 100,
    maxChildren: 800,
    now: () => 0,
    timeBudgetMs: 100,
  });
  assert.equal(lunar.move.orbitalName, "lunarMine");
  assert.equal(state.currentPlayer.activeShips[lunar.move.shipIndexes[0]].value, 6);
  assert.equal(ExhaustiveAI.executeMove(state, lunar.move), true);

  const artifact = ExhaustiveAI.searchLegacyCompact(state, {
    maxNodes: 12_800,
    maxDepth: 100,
    maxChildren: 800,
    now: () => 0,
    timeBudgetMs: 100,
  });
  assert.equal(artifact.move.orbitalName, "alienArtifact");
  assert.deepEqual(
    artifact.move.shipIndexes.map((shipIndex) => state.currentPlayer.activeShips
      .find((ship) => ship.shipIndex === shipIndex).value).sort((left, right) => left - right),
    [5, 6],
  );
});

test("search evaluation does not consume the game random stream", () => {
  let randomCalls = 0;
  const state = new GameState(2, [AIType.easy, AIType.human], () => {
    randomCalls += 1;
    return 0.5;
  });
  const callsAfterSetup = randomCalls;

  ExhaustiveAI.search(state, {
    generateChildren: () => [],
    maxDepth: 1,
    maxNodes: 1,
    now: () => 0,
    timeBudgetMs: 100,
  });

  assert.equal(randomCalls, callsAfterSetup);
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

test("fair search reserves nodes across depths and frontier entries", () => {
  const root = new GameState(2, [AIType.hard, AIType.human]);
  const graph = new Map([[root, Array.from({ length: 20 }, (_, index) => {
    const child = new GameState(2, [AIType.hard, AIType.human]);
    child.currentPlayer.fuel = index + 1;
    return { state: child, move: `root-${index}` };
  })]]);
  for (const child of graph.get(root)) {
    const grandchild = new GameState(2, [AIType.hard, AIType.human]);
    grandchild.currentPlayer.fuel = child.state.currentPlayer.fuel + 20;
    graph.set(child.state, [{ state: grandchild, move: "continue" }]);
  }

  const result = ExhaustiveAI.search(root, {
    generateChildren: (state) => graph.get(state) ?? [],
    evaluate: (state) => state.currentPlayer.fuel,
    maxDepth: 4,
    maxNodes: 24,
    beamWidth: 20,
    distributeChildrenAcrossFrontier: true,
    now: () => 0,
    timeBudgetMs: 100,
  });

  assert.equal(result.principalVariation.length, 2);
  assert.ok(result.expandedNodes <= 24);
});

test("legacy parity search backs up completed descendant layers", () => {
  const root = new GameState(2, [AIType.hard, AIType.human]);
  const immediate = new GameState(2, [AIType.hard, AIType.human]);
  const setup = new GameState(2, [AIType.hard, AIType.human]);
  const immediateContinuation = new GameState(2, [AIType.hard, AIType.human]);
  const setupPayoff = new GameState(2, [AIType.hard, AIType.human]);
  immediate.currentPlayer.fuel = 10;
  setup.currentPlayer.fuel = 5;
  immediateContinuation.currentPlayer.fuel = 1;
  setupPayoff.currentPlayer.fuel = 20;
  root.currentPlayer.fuel = 2;
  const graph = new Map([
    [root, [
      { state: immediate, move: "immediate" },
      { state: setup, move: "setup" },
    ]],
    [immediate, [{ state: immediateContinuation, move: "decline" }]],
    [setup, [{ state: setupPayoff, move: "payoff" }]],
  ]);
  const options = {
    generateChildren: (state) => graph.get(state) ?? [],
    evaluate: (state) => state.currentPlayer.fuel,
    maxDepth: 3,
    now: () => 0,
    timeBudgetMs: 100,
  };

  const complete = ExhaustiveAI.searchLegacyParity(root, { ...options, maxNodes: 10 });
  assert.equal(complete.move, "setup");
  assert.equal(complete.completedDepth, 3);

  const interrupted = ExhaustiveAI.searchLegacyParity(root, { ...options, maxNodes: 3 });
  assert.equal(interrupted.move, "immediate");
  assert.equal(interrupted.completedDepth, 1);
});

test("legacy probe recycles pruned states while retaining deeper candidates", () => {
  const root = new GameState(2, [AIType.hard, AIType.human]);
  root.currentPlayer.initialRollDone = true;
  root.currentPlayer.activeShips[0].value = 1;
  root.currentPlayer.activeShips[1].value = 2;
  root.currentPlayer.activeShips[2].value = 3;

  const result = ExhaustiveAI.searchLegacyProbe(root, {
    maxNodes: 100,
    maxDepth: 5,
    beamWidth: 4,
    maxChildren: 32,
    now: () => 0,
    timeBudgetMs: 100,
  });

  assert.ok(result.completedDepth >= 2);
  assert.ok(result.createdStates < result.expandedNodes);
  assert.ok(result.peakStates <= 36);
  assert.equal(result.leakedStates, 0);
});

test("legacy compact search preserves full-width parity with pooled reconstruction", () => {
  const state = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  state.currentPlayer.initialRollDone = true;
  state.currentPlayer.activeShips[0].value = 1;
  state.currentPlayer.activeShips[1].value = 2;
  state.currentPlayer.activeShips[2].value = 3;
  const generateChildren = (candidate, search) => ExhaustiveAI.orbitalMoves(candidate, {
    maxChildren: Math.min(64, search.remainingNodes),
    shouldContinue: search.shouldContinue,
    includeColonyMoves: true,
    includeRaidArtifactMoves: true,
    includeTechPowerMoves: true,
    includeTechDiscardMoves: true,
    legacyParity: true,
  });
  const baseline = ExhaustiveAI.searchLegacyParity(state, {
    generateChildren,
    evaluate: (candidate) => evaluateLegacyParityState(candidate, 0),
    maxNodes: 300,
    maxDepth: 5,
    now: () => 0,
    timeBudgetMs: 100,
  });
  const compact = ExhaustiveAI.searchLegacyCompact(state, {
    evaluate: (candidate) => evaluateLegacyParityState(candidate, 0),
    maxNodes: 300,
    maxDepth: 5,
    maxChildren: 64,
    now: () => 0,
    timeBudgetMs: 100,
  });

  assert.deepEqual(compact.move, baseline.move);
  assert.equal(compact.score, baseline.score);
  assert.equal(compact.completedDepth, baseline.completedDepth);
  assert.equal(compact.uniqueStates, baseline.uniqueStates);
  assert.ok(compact.peakStates <= 65);
  assert.equal(compact.leakedStates, 0);
});

test("legacy compact search rejects transient unresolved interaction states", () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  state.currentPlayer.startRaid();
  assert.throws(
    () => ExhaustiveAI.searchLegacyCompact(state),
    /stable, fully resolved search state/,
  );
});

test("pooled legacy searches do not consume live game random streams", () => {
  let randomCalls = 0;
  let cardRandomCalls = 0;
  const state = new GameState(
    2,
    [AIType.hard, AIType.human],
    () => { randomCalls += 1; return 0.5; },
    () => { cardRandomCalls += 1; return 0.5; },
  );
  state.currentPlayer.initialRollDone = true;
  const before = { randomCalls, cardRandomCalls };

  ExhaustiveAI.searchLegacyCompact(state, {
    maxNodes: 100,
    maxDepth: 3,
    maxChildren: 32,
    now: () => 0,
    timeBudgetMs: 100,
  });
  ExhaustiveAI.searchLegacyProbe(state, {
    maxNodes: 100,
    maxDepth: 3,
    beamWidth: 4,
    maxChildren: 32,
    now: () => 0,
    timeBudgetMs: 100,
  });

  assert.deepEqual({ randomCalls, cardRandomCalls }, before);
});

test("compact transposition fingerprints match exact LegacyCompact decisions", () => {
  const state = createLateGameStressState();
  const options = {
    maxNodes: 2_000,
    maxDepth: 5,
    maxChildren: 256,
    now: () => 0,
    timeBudgetMs: 100,
  };
  const exact = ExhaustiveAI.searchLegacyCompact(state, {
    ...options,
    exactTranspositions: true,
  });
  const compact = ExhaustiveAI.searchLegacyCompact(state, options);

  assert.deepEqual(compact.move, exact.move);
  assert.equal(compact.score, exact.score);
  assert.equal(compact.completedDepth, exact.completedDepth);
  assert.equal(compact.uniqueStates, exact.uniqueStates);
  assert.equal(compact.expandedNodes, exact.expandedNodes);
});

test("legacy fair probe budgets every root action and returns arena states", () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  state.currentPlayer.initialRollDone = true;
  state.currentPlayer.activeShips[0].value = 1;
  state.currentPlayer.activeShips[1].value = 2;
  state.currentPlayer.activeShips[2].value = 3;

  const result = ExhaustiveAI.searchLegacyFairProbe(state, {
    maxNodes: 200,
    maxDepth: 5,
    maxChildren: 64,
    probeBeamWidth: 4,
    now: () => 0,
    timeBudgetMs: 100,
  });

  assert.ok(result.rootActions > 1);
  assert.equal(
    result.budgetPerRoot,
    Math.floor((200 - result.rootActions) / result.rootActions),
  );
  assert.ok(result.completedDepth >= 2);
  assert.equal(result.leakedStates, 0);
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
  assert.equal(children.every(({ state: child, positionKey }) =>
    exhaustivePositionKeysEqual(positionKey, exhaustivePositionKey(child))), true);
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

test("Raiders and Artifact successors are opt-in and resolve atomically", () => {
  const state = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  const [raider, victim] = state.players;
  raider.initialRollDone = true;
  raider.fuel = 1;
  raider.ore = 1;
  victim.fuel = 2;
  victim.ore = 2;
  [1, 2, 3].forEach((value, index) => {
    raider.activeShips[index].value = value;
  });
  state.burroughsDesert.colonyCounts[raider.playerIndex] = 1;

  const historical = ExhaustiveAI.orbitalMoves(state, { includeRaidArtifactMoves: false });
  assert.equal(historical.some(({ move }) => move.type === "raid"), false);
  assert.equal(historical.some(({ move }) => move.type === "purchase-artifact-ship"), false);

  const expanded = ExhaustiveAI.orbitalMoves(state, {
    includeRaidArtifactMoves: true,
    maxChildren: 256,
  });
  const raidChildren = expanded.filter(({ move }) => move.type === "raid");
  assert.ok(raidChildren.length > 0);
  assert.ok(raidChildren.every(({ state: child }) => !child.currentPlayer.isRaiding));
  assert.ok(expanded.some(({ move }) => move.type === "purchase-artifact-ship"));

  const branchingState = new GameState(
    4,
    [AIType.hard, AIType.human, AIType.human, AIType.human],
    () => 0.5,
    () => 0.5,
  );
  branchingState.currentPlayer.initialRollDone = true;
  [1, 2, 3].forEach((value, index) => {
    branchingState.currentPlayer.activeShips[index].value = value;
  });
  for (const branchingVictim of branchingState.players.slice(1)) {
    branchingVictim.ore = 4;
    branchingVictim.fuel = 4;
  }
  const sourceKey = exhaustiveStateKey(branchingState);
  const compressed = ExhaustiveAI.orbitalMoves(branchingState, {
    includeRaidArtifactMoves: true,
    maxRaidOutcomes: 12,
    maxChildren: 256,
  });
  assert.equal(compressed.filter(({ move }) => move.type === "raid").length, 12);
  assert.equal(exhaustiveStateKey(branchingState), sourceKey);

  const selectedRaid = raidChildren[0];
  const executionState = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  executionState.currentPlayer.initialRollDone = true;
  executionState.players[1].fuel = 2;
  executionState.players[1].ore = 2;
  [1, 2, 3].forEach((value, index) => {
    executionState.currentPlayer.activeShips[index].value = value;
  });
  assert.equal(ExhaustiveAI.executeMove(executionState, selectedRaid.move), true);
  assert.equal(executionState.currentPlayer.isRaiding, false);
});

test("Artifact credit generates each deterministic legal displayed purchase", () => {
  const state = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.cards = [];
  player.artifactCreditAvailable = 8;
  const expectedCardIDs = state.techDisplayDeck
    .filter((card) => player.canPurchaseCard(card))
    .map((card) => card.cardID)
    .sort((left, right) => left - right);

  const children = ExhaustiveAI.orbitalMoves(state, {
    includeRaidArtifactMoves: true,
    maxChildren: 256,
  });
  const purchaseChildren = children.filter(({ move }) => move.type === "purchase-tech");
  assert.deepEqual(
    purchaseChildren.map(({ move }) => move.cardID).sort((left, right) => left - right),
    expectedCardIDs,
  );
  assert.ok(purchaseChildren.every(({ state: child }) =>
    child.currentPlayer.artifactCreditAvailable === 0
    && child.techDisplayDeck.length === 3));
});

test("active tech successors are opt-in, atomic, and executable", () => {
  const state = createLateGameStressState();
  const player = state.currentPlayer;
  player.fuel = 20;
  state.herbertValley.hasIsolationField = false;

  const historical = ExhaustiveAI.orbitalMoves(state, {
    includeTechPowerMoves: false,
    maxChildren: 256,
  });
  assert.equal(historical.some(({ move }) => move.type.startsWith("tech-")), false);

  const expanded = ExhaustiveAI.orbitalMoves(state, {
    includeTechPowerMoves: true,
    maxChildren: 256,
  });
  const techChildren = expanded.filter(({ move }) => move.type.startsWith("tech-"));
  const techTypes = new Set(techChildren.map(({ move }) => move.type));
  assert.ok(techTypes.has("tech-ship"));
  assert.ok(techTypes.has("tech-gravity"));
  assert.ok(techTypes.has("tech-region"));
  assert.ok(techTypes.has("tech-plasma"));
  assert.ok(techChildren.every(({ state: child, move }) => {
    const card = child.allTech.find((candidate) => candidate.cardID === move.cardID);
    return card.tapped && child.pendingTechCard === null;
  }));

  const selectedMove = techChildren.find(({ move }) => move.type === "tech-gravity").move;
  assert.equal(ExhaustiveAI.executeMove(state, selectedMove), true);
  assert.equal(state.allTech.find((card) => card.cardID === selectedMove.cardID).tapped, true);
});

test("tech discard successors cover implemented board effects atomically", () => {
  const state = createLateGameStressState();
  const player = state.currentPlayer;
  player.techsDiscarded = 0;
  const historical = ExhaustiveAI.orbitalMoves(state, {
    includeTechDiscardMoves: false,
    maxChildren: 800,
  });
  assert.equal(historical.some(({ move }) => move.type.startsWith("discard-")), false);

  const expanded = ExhaustiveAI.orbitalMoves(state, {
    includeTechDiscardMoves: true,
    maxChildren: 800,
  });
  const discardChildren = expanded.filter(({ move }) => move.type.startsWith("discard-"));
  const discardTypes = new Set(discardChildren.map(({ move }) => move.type));
  assert.ok(discardTypes.has("discard-region"));
  assert.ok(discardTypes.has("discard-ship"));
  assert.ok(discardTypes.has("discard-teleporter-colony"));
  assert.ok(discardTypes.has("discard-polarity-colonies"));
  assert.ok(discardChildren.every(({ state: child, move }) =>
    !child.currentPlayer.cards.some((card) => card.cardID === move.cardID)
    && child.pendingTechCard === null));

  const compressed = ExhaustiveAI.orbitalMoves(createLateGameStressState(), {
    includeTechDiscardMoves: true,
    maxTechDiscardMovesPerType: 12,
    maxChildren: 800,
  });
  const compressedCounts = compressed
    .filter(({ move }) => move.type.startsWith("discard-"))
    .reduce((counts, { move }) => {
      counts.set(move.type, (counts.get(move.type) ?? 0) + 1);
      return counts;
    }, new Map());
  assert.deepEqual(new Set(compressedCounts.keys()), discardTypes);
  assert.ok([...compressedCounts.values()].every((count) => count <= 12));

  const selected = discardChildren.find(({ move }) =>
    move.type === "discard-polarity-colonies").move;
  assert.equal(ExhaustiveAI.executeMove(state, selected), true);
  assert.equal(player.cards.some((card) => card.cardID === selected.cardID), false);
  assert.equal(player.techsDiscarded, 1);
});

test("legacy parity pruning matches original raid and field-discard guidance", () => {
  const state = createLateGameStressState();
  const player = state.currentPlayer;
  player.fuel = 20;
  player.coloniesLeft = 1;
  for (const region of state.regions) {
    region.colonyCounts = [0, 0, 0, 0];
  }
  state.heinleinPlains.colonyCounts = [2, 0, 0, 0];
  state.pohlFoothills.colonyCounts = [0, 2, 0, 0];
  state.vanVogtMountains.colonyCounts = [0, 0, 0, 0];
  state.pohlFoothills.hasRepulsorField = false;

  const children = ExhaustiveAI.orbitalMoves(state, {
    includeRaidArtifactMoves: true,
    includeTechPowerMoves: true,
    includeTechDiscardMoves: true,
    legacyParity: true,
    maxChildren: 800,
  });
  const resourceRaids = children.filter(({ move }) =>
    move.type === "raid" && move.outcome.type === "resources");
  const raidsByStraight = resourceRaids.reduce((groups, raid) => {
    const key = raid.move.shipIndexes.join(",");
    const raids = groups.get(key) ?? [];
    raids.push(raid);
    groups.set(key, raids);
    return groups;
  }, new Map());
  assert.ok([...raidsByStraight.values()].every((raids) => raids.length <= 5));

  const discardChildren = children.filter(({ move }) => move.type === "discard-region");
  const isolation = discardChildren.filter(({ move }) =>
    state.allTech.find((card) => card.cardID === move.cardID).type === TechCardType.stasisBeam);
  const positron = discardChildren.filter(({ move }) =>
    state.allTech.find((card) => card.cardID === move.cardID).type === TechCardType.dataCrystal);
  assert.ok(isolation.every(({ move }) => move.regionIndex === 1));
  assert.deepEqual(positron.map(({ move }) => move.regionIndex), [0]);
  assert.equal(children.some(({ move }) => [
    "discard-ship",
    "discard-teleporter-colony",
    "discard-polarity-colonies",
  ].includes(move.type)), false);
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

test("search expands Colony Constructor through mandatory region placement", () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.ore = 3;
  player.activeShips.forEach((ship) => { ship.value = 4; });

  const constructorChild = ExhaustiveAI.orbitalMoves(state).find(({ move }) =>
    move.orbitalName === "colonyConstructor");
  assert.ok(constructorChild);
  assert.equal(constructorChild.state.currentPlayer.coloniesToLaunch, 1);
  const regionChildren = ExhaustiveAI.orbitalMoves(constructorChild.state);
  assert.equal(regionChildren.length, 8);
  assert.equal(regionChildren.every(({ move }) => move.type === "launch-colony"), true);
  assert.equal(regionChildren.every(({ state: child }) =>
    child.currentPlayer.coloniesToLaunch === 0), true);
});

test("search expands Terraforming and paid Hub launches through colony placement", () => {
  const terraforming = new GameState(2, [AIType.hard, AIType.human]);
  const terraformPlayer = terraforming.currentPlayer;
  terraformPlayer.activateShip();
  terraformPlayer.gatherShips();
  terraformPlayer.initialRollDone = true;
  terraformPlayer.ore = 1;
  terraformPlayer.fuel = 1;
  terraformPlayer.activeShips[0].value = 6;
  const terraformChild = ExhaustiveAI.orbitalMoves(terraforming).find(({ move }) =>
    move.orbitalName === "terraformingStation");
  assert.ok(terraformChild);
  assert.equal(ExhaustiveAI.orbitalMoves(terraformChild.state).some(({ move }) =>
    move.type === "launch-colony"), true);

  const hub = new GameState(2, [AIType.hard, AIType.human]);
  hub.currentPlayer.initialRollDone = true;
  hub.currentPlayer.ore = 1;
  hub.currentPlayer.fuel = 1;
  hub.colonistHub.colonyPositions[0] = 7;
  const hubChild = ExhaustiveAI.orbitalMoves(hub).find(({ move }) => move.type === "hub-launch");
  assert.ok(hubChild);
  assert.equal(hubChild.state.currentPlayer.coloniesToLaunch, 1);
  assert.equal(ExhaustiveAI.orbitalMoves(hubChild.state).some(({ move }) =>
    move.type === "launch-colony"), true);
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
