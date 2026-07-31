import assert from "node:assert/strict";
import test from "node:test";

import { AIType } from "../js/game/constants.js";
import { StartGameScene } from "../js/scenes/start-game.js";

test("AI setup labels expose Simple while preserving personality IDs", () => {
  assert.equal(StartGameScene.prototype.getAIName(AIType.human), "Human");
  assert.equal(StartGameScene.prototype.getAIName(AIType.easy), "AI: Simple");
  assert.equal(StartGameScene.prototype.getAIName(AIType.medium), "AI: Spacer");
  assert.equal(StartGameScene.prototype.getAIName(AIType.hard), "AI: Admiral");
  assert.equal(StartGameScene.prototype.getAIName(AIType.pirate), "AI: Pirate");
});
