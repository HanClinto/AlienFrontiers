const STORAGE_KEY = "alien-frontiers:fullscreen";

export class FullscreenPreferences {
  constructor(
    documentRef = typeof document === "undefined" ? null : document,
    storage = typeof localStorage === "undefined" ? null : localStorage,
    windowRef = typeof window === "undefined" ? null : window,
  ) {
    this.document = documentRef;
    this.storage = storage;
    this.window = windowRef;
    this.enabled = storage?.getItem(STORAGE_KEY) === "on";
    this.armed = false;
  }

  get isStandalone() {
    return this.window?.matchMedia?.("(display-mode: standalone)").matches
      || this.window?.matchMedia?.("(display-mode: fullscreen)").matches
      || this.window?.navigator?.standalone === true;
  }

  get isActive() {
    return Boolean(this.document?.fullscreenElement) || this.isStandalone;
  }

  get isSupported() {
    return typeof this.document?.documentElement?.requestFullscreen === "function";
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.storage?.setItem(STORAGE_KEY, enabled ? "on" : "off");
  }

  async toggle() {
    if (this.isActive) {
      this.setEnabled(false);
      if (this.document?.fullscreenElement) {
        await this.document.exitFullscreen?.();
      }
      return false;
    }

    this.setEnabled(true);
    return this.request();
  }

  async request() {
    if (this.isActive) {
      return true;
    }
    if (!this.isSupported) {
      return false;
    }
    try {
      await this.document.documentElement.requestFullscreen({ navigationUI: "hide" });
      return true;
    } catch {
      return false;
    }
  }

  armForNextGesture() {
    if (!this.enabled || this.isActive || !this.isSupported || this.armed) {
      return;
    }
    this.armed = true;
    this.document.addEventListener("pointerdown", () => {
      this.armed = false;
      void this.request();
    }, { capture: true, once: true });
  }
}