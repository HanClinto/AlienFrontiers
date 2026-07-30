import assert from "node:assert/strict";
import test from "node:test";

import { rollingTrayPosition } from "../js/scenes/game.js";

test("all six ships wrap into the original four-column tray", () => {
  assert.deepEqual(
    Array.from({ length: 6 }, (_, shipIndex) => rollingTrayPosition(shipIndex)),
    [
      { x: 600, y: 77 },
      { x: 638, y: 77 },
      { x: 676, y: 77 },
      { x: 714, y: 77 },
      { x: 600, y: 37 },
      { x: 638, y: 37 },
    ],
  );
});