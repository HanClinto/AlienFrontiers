import assert from "node:assert/strict";
import test from "node:test";

import { MainMenuCreditsRoll } from "../js/scenes/main-menu.js";

test("main-menu credits reproduce the original timing, columns, and fixed scale", () => {
  const roll = new MainMenuCreditsRoll(["RELEASE NOTES", "LEFT;RIGHT"], 1);

  roll.update(0.99);
  assert.equal(roll.children.length, 0);

  roll.update(0.01);
  assert.equal(roll.children.length, 1);
  const firstLabel = roll.children[0];
  assert.equal(firstLabel.text, "RELEASE NOTES");
  assert.equal(firstLabel.position.y, 50);
  assert.equal(firstLabel.opacity, 0);

  roll.update(0.75);
  assert.equal(roll.children.length, 3);
  assert.ok(firstLabel.position.y > 50);
  assert.ok(firstLabel.opacity > 0);
  assert.equal(firstLabel.scaleX, 1);
  assert.equal(firstLabel.scaleY, 1);
  assert.deepEqual(
    roll.children.slice(1).map((label) => [label.text, label.position.x]),
    [["LEFT", 231], ["RIGHT", 537]],
  );

  roll.update(7.25);
  assert.equal(firstLabel.parent, null);
  assert.equal(roll.lineIndex, 1);
});
