import assert from "node:assert/strict";
import test from "node:test";

import { FullscreenPreferences } from "../js/fullscreen.js";

function fixture({ saved = null, standalone = false } = {}) {
  const values = new Map(saved ? [["alien-frontiers:fullscreen", saved]] : []);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const listeners = [];
  const documentElement = {
    async requestFullscreen(options) {
      documentRef.requestOptions = options;
      documentRef.fullscreenElement = documentElement;
    },
  };
  const documentRef = {
    documentElement,
    fullscreenElement: null,
    addEventListener: (name, callback, options) => listeners.push({ name, callback, options }),
    async exitFullscreen() {
      documentRef.fullscreenElement = null;
    },
  };
  const windowRef = {
    navigator: { standalone },
    matchMedia: () => ({ matches: false }),
  };
  return {
    preferences: new FullscreenPreferences(documentRef, storage, windowRef),
    documentRef,
    listeners,
    values,
  };
}

test("fullscreen opt-in is persisted and uses hidden navigation UI", async () => {
  const { preferences, documentRef, values } = fixture();

  assert.equal(await preferences.toggle(), true);
  assert.equal(values.get("alien-frontiers:fullscreen"), "on");
  assert.deepEqual(documentRef.requestOptions, { navigationUI: "hide" });

  assert.equal(await preferences.toggle(), false);
  assert.equal(values.get("alien-frontiers:fullscreen"), "off");
  assert.equal(documentRef.fullscreenElement, null);
});

test("a saved preference requests fullscreen on the next user gesture", async () => {
  const { preferences, documentRef, listeners } = fixture({ saved: "on" });

  preferences.armForNextGesture();
  preferences.armForNextGesture();
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].name, "pointerdown");
  assert.deepEqual(listeners[0].options, { capture: true, once: true });

  listeners[0].callback();
  await Promise.resolve();
  assert.equal(documentRef.fullscreenElement, documentRef.documentElement);
});

test("installed web apps count as fullscreen without using the API", () => {
  const { preferences } = fixture({ standalone: true });

  assert.equal(preferences.isActive, true);
  assert.equal(preferences.isStandalone, true);
});