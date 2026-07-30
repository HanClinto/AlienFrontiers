import assert from "node:assert/strict";
import test from "node:test";

import { regionAtBoardPoint, rollingTrayPosition } from "../js/scenes/game.js";

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

test("planet touches map to the original radial regions", () => {
  const regions = {
    burroughsDesert: { title: "Burroughs" },
    heinleinPlains: { title: "Heinlein" },
    pohlFoothills: { title: "Pohl" },
    vanVogtMountains: { title: "Van Vogt" },
    bradburyPlateau: { title: "Bradbury" },
    asimovCrater: { title: "Asimov" },
    herbertValley: { title: "Herbert" },
    lemBadlands: { title: "Lem" },
  };

  assert.equal(regionAtBoardPoint(regions, { x: 381, y: 580 }), regions.burroughsDesert);
  assert.equal(regionAtBoardPoint(regions, { x: 381, y: 700 }), regions.heinleinPlains);
  assert.equal(regionAtBoardPoint(regions, { x: 501, y: 580 }), regions.pohlFoothills);
  assert.equal(regionAtBoardPoint(regions, { x: 381, y: 450 }), regions.bradburyPlateau);
  assert.equal(regionAtBoardPoint(regions, { x: 251, y: 580 }), regions.herbertValley);
  assert.equal(regionAtBoardPoint(regions, { x: 700, y: 580 }), null);
});