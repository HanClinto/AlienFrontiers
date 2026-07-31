import assert from "node:assert/strict";
import test from "node:test";

import { AIType } from "../js/game/constants.js";
import { AISearchPreferences } from "../js/game/ai-prefs.js";
import { ExhaustiveAI } from "../js/game/exhaustive-ai.js";
import { GameState } from "../js/game/game-state.js";
import { SimpleAI } from "../js/game/simple-ai.js";
import { GameScene } from "../js/scenes/game.js";

function contextFor(state, aiPreferences = null) {
  const context = {
    state,
    aiAbortController: null,
    director: { aiPreferences },
  };
  context.director.scene = context;
  return context;
}

test("Simple remains on SimpleAI without starting a worker search", async () => {
  const state = new GameState(2, [AIType.easy, AIType.human], () => 0.5, () => 0.5);
  const context = contextFor(state);
  const originalSimpleStep = SimpleAI.step;
  const originalThink = ExhaustiveAI.think;
  let simpleCalls = 0;
  try {
    SimpleAI.step = () => { simpleCalls += 1; return true; };
    ExhaustiveAI.think = async () => { throw new Error("Simple must not search"); };
    assert.equal(await GameScene.prototype.runScheduledAI.call(context), true);
    assert.equal(simpleCalls, 1);
  } finally {
    SimpleAI.step = originalSimpleStep;
    ExhaustiveAI.think = originalThink;
  }
});

test("higher AI levels execute LegacyCompact worker moves", async () => {
  const state = new GameState(2, [AIType.hard, AIType.human], () => 0.5, () => 0.5);
  state.currentPlayer.initialRollDone = true;
  state.currentPlayer.activeShips[0].value = 6;
  const preferences = new AISearchPreferences({
    getItem: () => "quick",
    setItem: () => {},
  });
  const context = contextFor(state, preferences);
  const originalThink = ExhaustiveAI.think;
  let receivedOptions = null;
  try {
    ExhaustiveAI.think = async (_state, options) => {
      receivedOptions = options;
      return {
        move: { type: "orbital", orbitalName: "solarConverter", shipIndexes: [0] },
      };
    };
    assert.equal(await GameScene.prototype.runScheduledAI.call(context), true);
    assert.equal(receivedOptions.policy, "legacy-compact");
    assert.equal(receivedOptions.maxNodes, 3_200);
    assert.equal(receivedOptions.timeBudgetMs, 2_000);
    assert.equal(state.currentPlayer.activeShips[0].dock.orbital, state.solarConverter);
  } finally {
    ExhaustiveAI.think = originalThink;
  }
});

test("stale worker results are ignored and worker failures fall back", async () => {
  const state = new GameState(2, [AIType.medium, AIType.human], () => 0.5, () => 0.5);
  state.currentPlayer.initialRollDone = true;
  const context = contextFor(state);
  const originalThink = ExhaustiveAI.think;
  const originalSimpleStep = SimpleAI.step;
  let resolveThink;
  let simpleCalls = 0;
  try {
    ExhaustiveAI.think = () => new Promise((resolve) => { resolveThink = resolve; });
    SimpleAI.step = () => { simpleCalls += 1; return true; };
    const pending = GameScene.prototype.runScheduledAI.call(context);
    state.currentPlayer.fuel += 1;
    resolveThink({ move: { type: "orbital", orbitalName: "solarConverter", shipIndexes: [0] } });
    assert.equal(await pending, false);
    assert.equal(simpleCalls, 0);

    ExhaustiveAI.think = async () => ({ fallbackRequired: true, error: "worker failed" });
    assert.equal(await GameScene.prototype.runScheduledAI.call(context), true);
    assert.equal(simpleCalls, 1);
  } finally {
    ExhaustiveAI.think = originalThink;
    SimpleAI.step = originalSimpleStep;
  }
});
