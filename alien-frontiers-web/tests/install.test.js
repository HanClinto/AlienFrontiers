import assert from "node:assert/strict";
import test from "node:test";

import { InstallPreferences } from "../js/install.js";

function fixture({ standalone = false } = {}) {
  const listeners = new Map();
  const values = new Map();
  const windowRef = {
    navigator: { standalone },
    matchMedia: () => ({ matches: false }),
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  return {
    preferences: new InstallPreferences(windowRef, storage),
    listeners,
    values,
  };
}

test("the browser install prompt is deferred until explicitly requested", async () => {
  const { preferences, listeners, values } = fixture();
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
  assert.equal(values.get("alien-frontiers:installed"), "yes");
});

test("unsupported browsers receive manual instructions unless already standalone", async () => {
  assert.equal(await fixture().preferences.request(), "instructions");
  assert.equal(await fixture({ standalone: true }).preferences.request(), "installed");
});