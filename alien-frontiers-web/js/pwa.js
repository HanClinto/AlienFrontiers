export async function registerServiceWorker(
  navigatorRef = typeof navigator === "undefined" ? null : navigator,
  moduleUrl = import.meta.url,
) {
  if (!navigatorRef?.serviceWorker) {
    return null;
  }

  const version = new URL(moduleUrl).searchParams.get("v");
  const workerUrl = new URL("../service-worker.js", moduleUrl);
  if (version) {
    workerUrl.searchParams.set("v", version);
  }
  return navigatorRef.serviceWorker.register(workerUrl, { updateViaCache: "none" });
}