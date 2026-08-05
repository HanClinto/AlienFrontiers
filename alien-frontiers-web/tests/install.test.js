import assert from "node:assert/strict";
import test from "node:test";

import { InstallPreferences, installGuidance, isMobileBrowser } from "../js/install.js";

function fixture({ standalone = false } = {}) {
  const listeners = new Map();
  const windowRef = {
    navigator: { standalone },
    matchMedia: () => ({ matches: false }),
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  return {
    preferences: new InstallPreferences(windowRef),
    listeners,
  };
}

test("the browser install prompt is deferred until explicitly requested", async () => {
  const { preferences, listeners } = fixture();
  let prevented = false;
  let prompted = false;
  const event = {
    preventDefault: () => { prevented = true; },
    prompt: async () => { prompted = true; },
    userChoice: Promise.resolve({ outcome: "accepted" }),
  };

  listeners.get("beforeinstallprompt")(event);
  assert.equal(prevented, true);
  assert.equal(prompted, false);

  assert.equal(await preferences.request(), "accepted");
  assert.equal(prompted, true);
  assert.equal(preferences.isInstalled, true);
});

test("unsupported browsers receive manual instructions unless already standalone", async () => {
  assert.equal(await fixture().preferences.request(), "instructions");
  assert.equal(await fixture({ standalone: true }).preferences.request(), "installed");
});

test("manual install guidance reflects browser capabilities", () => {
  assert.match(installGuidance({ userAgent: "Mozilla/5.0 (iPhone) Safari/605.1", standalone: false }), /Share.*Add to Home Screen/);
  assert.match(installGuidance({ userAgent: "Mozilla/5.0 (Android) Firefox/141.0" }), /browser menu.*Install/);
  assert.match(installGuidance({ userAgent: "Mozilla/5.0 Firefox/141.0" }), /does not currently install/);
  assert.match(installGuidance({ userAgent: "Mozilla/5.0 Safari/605.1" }), /File menu.*Add to Dock/);
});

test("home-screen install advertising is limited to mobile-class browsers", () => {
  assert.equal(isMobileBrowser({ navigator: { userAgent: "Mozilla/5.0 (Android) Firefox/141.0" } }), true);
  assert.equal(isMobileBrowser({ navigator: { userAgent: "Mozilla/5.0 (iPhone) Safari/605.1" } }), true);
  assert.equal(isMobileBrowser({ navigator: { userAgent: "Mozilla/5.0 (Macintosh)", maxTouchPoints: 5 } }), true);
  assert.equal(isMobileBrowser({ navigator: { userAgent: "Mozilla/5.0 (Macintosh)", maxTouchPoints: 0 } }), false);
});