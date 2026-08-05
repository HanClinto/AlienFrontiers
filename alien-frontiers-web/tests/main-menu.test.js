import assert from "node:assert/strict";
import test from "node:test";

import {
  MainMenuCreditsRoll,
  bugReportIssueUrl,
  creditsRollLines,
  mainMenuBuildLabel,
  openExternalLink,
} from "../js/scenes/main-menu.js";

test("main-menu build labels distinguish deployments from local development", () => {
  assert.equal(
    mainMenuBuildLabel("716c7ca123456789", "2026-08-05T12:00:00.000Z"),
    "BUILD 716c7ca1 · LAST UPDATED AUG 5, 2026",
  );
  assert.equal(mainMenuBuildLabel(""), "LOCAL BUILD");
});

test("bug reports open a prefilled GitHub issue with build and device details", () => {
  const issueUrl = new URL(bugReportIssueUrl({
    version: "716c7ca123456789",
    userAgent: "Example Browser/1.0",
    platform: "Example OS",
    viewport: "768x1024",
    screenSize: "1170x2532",
    devicePixelRatio: 3,
    installed: true,
    pageUrl: "https://hanclinto.github.io/AlienFrontiers/",
  }));

  assert.equal(issueUrl.origin, "https://github.com");
  assert.equal(issueUrl.pathname, "/hanclinto/AlienFrontiers/issues/new");
  assert.equal(issueUrl.searchParams.get("title"), "[Bug] ");
  const body = issueUrl.searchParams.get("body");
  assert.match(body, /## What happened\?/);
  assert.match(body, /Build: 716c7ca123456789/);
  assert.match(body, /Browser: Example Browser\/1\.0/);
  assert.match(body, /Platform: Example OS/);
  assert.match(body, /Viewport: 768x1024/);
  assert.match(body, /Screen: 1170x2532/);
  assert.match(body, /Pixel ratio: 3/);
  assert.match(body, /Installed app: yes/);
});

test("external links use native hyperlink navigation for installed app handoff", () => {
  const externalWindow = { opener: "source-window" };
  const windowObject = {
    open(...argumentsReceived) {
      assert.deepEqual(argumentsReceived, ["https://example.com/report", "_blank", ""]);
      return externalWindow;
    },
  };

  openExternalLink("https://example.com/report", windowObject);

  assert.equal(externalWindow.opener, null);
});

test("recent changes are displayed before the original credits", () => {
  assert.deepEqual(
    creditsRollLines("RECENT\n\nCHANGE\n", "ORIGINAL\r\nCREDITS\r\n"),
    ["RECENT", "", "CHANGE", "", "", "ORIGINAL", "CREDITS"],
  );
});

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
