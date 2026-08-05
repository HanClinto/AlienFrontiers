const VERSION = new URL(self.location.href).searchParams.get("v") ?? "development";
const CACHE_PREFIX = "alien-frontiers-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const OFFLINE_PAGE = new URL("./__offline__", self.location.href).href;
const PRECACHE_MANIFEST = new URL("./precache-manifest.json", self.location.href);
PRECACHE_MANIFEST.searchParams.set("v", VERSION);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const response = await fetch(PRECACHE_MANIFEST, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load offline files: ${response.status}`);
    }
    const { version, files } = await response.json();
    if (version !== VERSION || !Array.isArray(files)) {
      throw new Error("Offline file manifest does not match this release");
    }
    const cache = await caches.open(CACHE_NAME);
    for (let index = 0; index < files.length; index += 12) {
      await cache.addAll(files.slice(index, index + 12));
    }
    const indexUrl = files.find((url) => new URL(url, self.location.href).pathname.endsWith("/index.html"));
    const indexResponse = indexUrl ? await cache.match(indexUrl) : null;
    if (indexResponse) {
      await cache.put(OFFLINE_PAGE, indexResponse);
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
  })());
});

async function navigationResponse(request) {
  try {
    return await fetch(request, { cache: "no-store" });
  } catch {
    return (await caches.open(CACHE_NAME)).match(OFFLINE_PAGE);
  }
}

async function assetResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok && new URL(request.url).searchParams.get("v") === VERSION) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.endsWith("/version.json")
    || url.pathname.endsWith("/precache-manifest.json")
    || url.pathname.endsWith("/service-worker.js")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }
  event.respondWith(event.request.mode === "navigate"
    ? navigationResponse(event.request)
    : assetResponse(event.request));
});