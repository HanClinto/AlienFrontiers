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

export function showLoadFailure(
  container,
  locationRef = typeof location === "undefined" ? null : location,
) {
  if (!container) {
    return;
  }

  const message = container.ownerDocument.createElement("span");
  message.textContent = "Unable to load Alien Frontiers.";
  const reloadButton = container.ownerDocument.createElement("button");
  reloadButton.type = "button";
  reloadButton.textContent = "Reload";
  reloadButton.addEventListener("click", () => {
    reloadButton.disabled = true;
    reloadButton.textContent = "Reloading...";
    locationRef?.reload();
  });
  container.replaceChildren(message, reloadButton);
}

export class DeploymentUpdates {
  constructor(
    version,
    fetchRef = typeof fetch === "undefined" ? null : fetch,
    locationRef = typeof location === "undefined" ? null : location,
    moduleUrl = import.meta.url,
  ) {
    this.version = version;
    this.fetch = fetchRef;
    this.location = locationRef;
    this.manifestUrl = new URL("../version.json", moduleUrl);
    this.pendingCheck = null;
  }

  check() {
    if (!this.version || !this.fetch || !this.location) {
      return Promise.resolve({ current: true, version: this.version, deployedAt: "" });
    }
    if (!this.pendingCheck) {
      this.pendingCheck = this.checkNow().finally(() => {
        this.pendingCheck = null;
      });
    }
    return this.pendingCheck;
  }

  async checkNow() {
    try {
      const manifestUrl = new URL(this.manifestUrl);
      manifestUrl.searchParams.set("check", Date.now());
      const fetchRequest = this.fetch;
      const response = await fetchRequest(manifestUrl, { cache: "no-store" });
      if (!response.ok) {
        return { current: true, version: this.version, deployedAt: "" };
      }
      const metadata = await response.json();
      if (!metadata.version || metadata.version === this.version) {
        return { ...metadata, current: true };
      }
      const pageUrl = new URL(this.location.href);
      pageUrl.searchParams.set("build", metadata.version);
      this.location.replace(pageUrl);
      return { ...metadata, current: false };
    } catch {
      return { current: true, version: this.version, deployedAt: "" };
    }
  }
}

export function watchForDeploymentUpdates(
  updates,
  isMainMenu,
  documentRef = typeof document === "undefined" ? null : document,
  windowRef = typeof window === "undefined" ? null : window,
) {
  const check = () => {
    if (documentRef?.visibilityState === "visible" && isMainMenu()) {
      void updates.check();
    }
  };
  documentRef?.addEventListener?.("visibilitychange", check);
  windowRef?.addEventListener?.("pageshow", check);
}