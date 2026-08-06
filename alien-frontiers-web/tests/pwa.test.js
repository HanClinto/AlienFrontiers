import assert from "node:assert/strict";
import test from "node:test";

import {
  DeploymentUpdates,
  registerServiceWorker,
  watchForDeploymentUpdates,
} from "../js/pwa.js";

test("service worker registration inherits the deployment version", async () => {
  let registration = null;
  const navigatorRef = {
    serviceWorker: {
      register(url, options) {
        registration = { url, options };
        return Promise.resolve(registration);
      },
    },
  };

  await registerServiceWorker(navigatorRef, "https://example.com/game/js/pwa.js?v=release-1");

  assert.equal(registration.url.href, "https://example.com/game/service-worker.js?v=release-1");
  assert.deepEqual(registration.options, { updateViaCache: "none" });
});

test("unsupported browsers skip service worker registration", async () => {
  assert.equal(await registerServiceWorker({}, "https://example.com/js/pwa.js"), null);
});

test("deployment checks reload a stale resumed app and share concurrent requests", async () => {
  let fetchCount = 0;
  let replacement = null;
  const fetchDeployment = async function () {
    assert.equal(this, undefined);
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({ version: "release-2", deployedAt: "2026-08-05T12:00:00.000Z" }),
    };
  };
  const updates = new DeploymentUpdates(
    "release-1",
    fetchDeployment,
    {
      href: "https://example.com/game/?seat=1",
      replace: (url) => { replacement = url; },
    },
    "https://example.com/game/js/pwa.js?v=release-1",
  );

  const [first, second] = await Promise.all([updates.check(), updates.check()]);
  assert.equal(fetchCount, 1);
  assert.equal(first.current, false);
  assert.deepEqual(second, first);
  assert.equal(replacement.href, "https://example.com/game/?seat=1&build=release-2");
});

test("deployment checks stay silent when the current version is deployed", async () => {
  let replacement = null;
  const updates = new DeploymentUpdates(
    "release-1",
    async () => ({
      ok: true,
      json: async () => ({ version: "release-1", deployedAt: "2026-08-05T12:00:00.000Z" }),
    }),
    {
      href: "https://example.com/game/",
      replace: (url) => { replacement = url; },
    },
    "https://example.com/game/js/pwa.js?v=release-1",
  );

  const result = await updates.check();

  assert.equal(result.current, true);
  assert.equal(replacement, null);
});

test("only the visible unobscured home menu resumes deployment checks", () => {
  const listeners = new Map();
  const documentRef = {
    visibilityState: "hidden",
    addEventListener: (name, callback) => listeners.set(`document:${name}`, callback),
  };
  const windowRef = {
    addEventListener: (name, callback) => listeners.set(`window:${name}`, callback),
  };
  let homeScreenVisible = true;
  let checks = 0;
  watchForDeploymentUpdates(
    { check: () => { checks += 1; } },
    () => homeScreenVisible,
    documentRef,
    windowRef,
  );

  listeners.get("document:visibilitychange")();
  assert.equal(checks, 0);
  documentRef.visibilityState = "visible";
  homeScreenVisible = false;
  listeners.get("window:pageshow")();
  assert.equal(checks, 0);
  homeScreenVisible = true;
  listeners.get("document:visibilitychange")();
  listeners.get("window:pageshow")();
  assert.equal(checks, 2);
});