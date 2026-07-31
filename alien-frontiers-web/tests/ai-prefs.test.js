import assert from "node:assert/strict";
import test from "node:test";

import { AISearchPreferences, AI_SEARCH_PRESETS } from "../js/game/ai-prefs.js";
import { AIType } from "../js/game/constants.js";
import { GameState } from "../js/game/game-state.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  };
}

test("AI search preferences persist and cycle explicit player presets", () => {
  const storage = memoryStorage();
  const preferences = new AISearchPreferences(storage);
  assert.equal(preferences.preset.id, "deep");
  assert.deepEqual(AI_SEARCH_PRESETS.map((preset) => preset.id), ["quick", "standard", "deep"]);

  assert.equal(preferences.cyclePreset().id, "quick");
  assert.equal(storage.values.get("alien-frontiers:ai-search"), "quick");
  assert.equal(new AISearchPreferences(storage).preset.id, "quick");
  assert.equal(preferences.setPreset("unknown"), false);
});

test("AI search presets provide explicit node and time limits", () => {
  const state = new GameState(2, [AIType.medium, AIType.human]);
  const preferences = new AISearchPreferences(memoryStorage({
    "alien-frontiers:ai-search": "quick",
  }));
  assert.deepEqual(preferences.optionsFor(state), {
    policy: "legacy-compact",
    maxNodes: 3_200,
    maxDepth: 100,
    maxChildren: 800,
    timeBudgetMs: 2_000,
  });

  preferences.setPreset("deep");
  assert.equal(preferences.optionsFor(state).timeBudgetMs, 4_400);
  state.currentPlayer.aiType = AIType.pirate;
  assert.deepEqual(preferences.optionsFor(state), {
    policy: "legacy-compact",
    maxNodes: 12_800,
    maxDepth: 100,
    maxChildren: 800,
    timeBudgetMs: 7_400,
  });
});
