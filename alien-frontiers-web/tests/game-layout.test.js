import assert from "node:assert/strict";
import test from "node:test";

import { colonistHubTrackPosition, gameLogPosition, miniHUDPosition, regionAtBoardPoint, rollingTrayPosition, SHIP_SPRITE_SCALE, techCardPosition, techDescriptionLayout, techTrayScrollBounds, techTrayVisibleRange } from "../js/scenes/game.js";

test("all six ships wrap into the original four-column tray", () => {
  assert.equal(SHIP_SPRITE_SCALE, 0.8);
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

test("player mini HUDs retain original centered spacing", () => {
  assert.deepEqual(
    Array.from({ length: 2 }, (_, index) => miniHUDPosition(2, index)),
    [{ x: 290.5, y: 1404 }, { x: 477.5, y: 1404 }],
  );
  assert.deepEqual(
    Array.from({ length: 3 }, (_, index) => miniHUDPosition(3, index)),
    [{ x: 197, y: 1404 }, { x: 384, y: 1404 }, { x: 571, y: 1404 }],
  );
  assert.deepEqual(
    Array.from({ length: 4 }, (_, index) => miniHUDPosition(4, index)),
    [
      { x: 103.5, y: 1404 },
      { x: 290.5, y: 1404 },
      { x: 477.5, y: 1404 },
      { x: 664.5, y: 1404 },
    ],
  );
  assert.deepEqual(miniHUDPosition(4, 0, true), { x: 103.5, y: 1024 });
});

test("tech cards use the original current and mini tray slots", () => {
  assert.deepEqual(
    Array.from({ length: 4 }, (_, index) => techCardPosition("tall", index)),
    [
      { x: 42, y: -12 },
      { x: 131, y: -12 },
      { x: 220, y: -12 },
      { x: 309, y: -12 },
    ],
  );
  assert.deepEqual(
    Array.from({ length: 4 }, (_, index) => techCardPosition("wide", index)),
    [
      { x: 30, y: -84 },
      { x: 30, y: -29 },
      { x: 30, y: 26 },
      { x: 30, y: 81 },
    ],
  );
});

test("tech tray scrolling is bounded to the original viewport play", () => {
  assert.deepEqual(techTrayScrollBounds("tall", 4), { min: -25, max: 0 });
  assert.deepEqual(techTrayScrollBounds("tall", 6), { min: -203, max: 0 });
  assert.deepEqual(techTrayScrollBounds("wide", 4), { min: -22, max: 0 });
  assert.deepEqual(techTrayScrollBounds("wide", 6), { min: -134, max: 0 });
});

test("tech trays hide whole cards using the original visible index range", () => {
  assert.deepEqual(techTrayVisibleRange("tall", 0), { min: 0, max: 3 });
  assert.deepEqual(techTrayVisibleRange("tall", -89), { min: 1, max: 4 });
  assert.deepEqual(techTrayVisibleRange("wide", 0), { min: 0, max: 3 });
  assert.deepEqual(techTrayVisibleRange("wide", -56), { min: 1, max: 4 });
});

test("game log occupies the original wrapped UITextView aperture", () => {
  assert.deepEqual(gameLogPosition(), { x: 40, y: 36 });
});

test("tech descriptions retain the original inspector centers and widths", () => {
  assert.deepEqual(techDescriptionLayout("power"), {
    position: { x: -164, y: -70 },
    size: { width: 160, height: 52 },
  });
  assert.deepEqual(techDescriptionLayout("discard"), {
    position: { x: 0, y: -70 },
    size: { width: 160, height: 52 },
  });
});

test("Colonist Hub tracks retain original compressed player rows", () => {
  assert.deepEqual(colonistHubTrackPosition(4, 0, 0), { x: 48, y: 0 });
  assert.deepEqual(colonistHubTrackPosition(4, 3, 6), { x: 216, y: -84 });
  assert.deepEqual(colonistHubTrackPosition(4, 3, 7), { x: 251, y: -84 });
  assert.deepEqual(colonistHubTrackPosition(2, 0, 2), { x: 104, y: -28 });
  assert.deepEqual(colonistHubTrackPosition(2, 1, 7), { x: 251, y: -56 });
});