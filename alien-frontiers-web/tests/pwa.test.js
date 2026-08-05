import assert from "node:assert/strict";
import test from "node:test";

import { registerServiceWorker } from "../js/pwa.js";

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