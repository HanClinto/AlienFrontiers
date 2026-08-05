const STORAGE_KEY = "alien-frontiers:installed";

export class InstallPreferences {
  constructor(
    windowRef = typeof window === "undefined" ? null : window,
    storage = typeof localStorage === "undefined" ? null : localStorage,
  ) {
    this.window = windowRef;
    this.storage = storage;
    this.promptEvent = null;
    this.installed = storage?.getItem(STORAGE_KEY) === "yes";
    windowRef?.addEventListener?.("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.promptEvent = event;
    });
    windowRef?.addEventListener?.("appinstalled", () => {
      this.markInstalled();
      this.promptEvent = null;
    });
  }

  get isStandalone() {
    return this.window?.matchMedia?.("(display-mode: standalone)").matches
      || this.window?.matchMedia?.("(display-mode: fullscreen)").matches
      || this.window?.navigator?.standalone === true;
  }

  get isInstalled() {
    return this.installed || this.isStandalone;
  }

  markInstalled() {
    this.installed = true;
    this.storage?.setItem(STORAGE_KEY, "yes");
  }

  async request() {
    if (this.isInstalled) {
      return "installed";
    }
    if (!this.promptEvent) {
      return "instructions";
    }

    const promptEvent = this.promptEvent;
    this.promptEvent = null;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      this.markInstalled();
    }
    return outcome;
  }
}