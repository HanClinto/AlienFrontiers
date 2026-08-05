export class InstallPreferences {
  constructor(
    windowRef = typeof window === "undefined" ? null : window,
  ) {
    this.window = windowRef;
    this.promptEvent = null;
    this.installed = false;
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

export function installGuidance(navigatorRef = typeof navigator === "undefined" ? null : navigator) {
  const userAgent = navigatorRef?.userAgent ?? "";
  const isFirefox = /Firefox|FxiOS/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || navigatorRef?.standalone !== undefined;
  const isAndroid = /Android/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|Edg/i.test(userAgent);

  if (isIOS) {
    return "On iPhone or iPad, tap Share, then Add to Home Screen.";
  }
  if (isFirefox && isAndroid) {
    return "In Firefox, open the browser menu, then choose Install or Add app to Home Screen.";
  }
  if (isFirefox) {
    return "Firefox desktop does not currently install web apps. Open Alien Frontiers in Chrome, Edge, or Safari to install it.";
  }
  if (isSafari) {
    return "In Safari, open the File menu and choose Add to Dock.";
  }
  return "Open your browser menu and choose Install App or Add to Home Screen.";
}
