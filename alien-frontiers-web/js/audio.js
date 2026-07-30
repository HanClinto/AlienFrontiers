import { AIType, EventName } from "./game/constants.js";

const EFFECT_FILES = Object.freeze({
  roll: "sfx-roll.mp3",
  select: "sfx-select.mp3",
  dock: "sfx-dock.mp3",
  button: "sfx-button.mp3",
  colony: "sfx-colony.mp3",
  card: "sfx-card.mp3",
  ship: "sfx-ship.mp3",
  turn: "sfx-turn.mp3",
});

export class GameAudioManager {
  constructor(
    baseUrl,
    audioFactory = (source) => new Audio(source),
    storage = typeof localStorage === "undefined" ? null : localStorage,
    version = "",
  ) {
    this.baseUrl = baseUrl;
    this.audioFactory = audioFactory;
    this.unlocked = false;
    this.unsubscribers = [];
    this.storage = storage;
    this.version = version;
    this.musicEnabled = storage?.getItem("alien-frontiers:music") !== "off";
    this.sfxEnabled = storage?.getItem("alien-frontiers:sfx") !== "off";
    this.music = this.audioFactory(this.url("music-background.mp3"));
    this.music.loop = true;
    this.music.volume = this.musicEnabled ? 0.25 : 0;
    this.effects = new Map(Object.entries(EFFECT_FILES).map(([name, fileName]) => {
      const audio = this.audioFactory(this.url(fileName));
      audio.preload = "auto";
      return [name, audio];
    }));
  }

  url(fileName) {
    const url = new URL(fileName, this.baseUrl);
    if (this.version) {
      url.searchParams.set("v", this.version);
    }
    return url.href;
  }

  unlock() {
    if (this.unlocked) {
      return;
    }
    this.unlocked = true;
    if (!this.musicEnabled) {
      return;
    }
    this.music.play()?.catch?.(() => {
      this.unlocked = false;
    });
  }

  play(name) {
    if (!this.unlocked || !this.sfxEnabled) {
      return;
    }
    const template = this.effects.get(name);
    if (!template) {
      return;
    }
    const effect = template.cloneNode ? template.cloneNode() : template;
    effect.volume = 1;
    effect.play()?.catch?.(() => {});
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    this.music.volume = enabled ? 0.25 : 0;
    this.storage?.setItem("alien-frontiers:music", enabled ? "on" : "off");
    if (enabled) {
      if (!this.unlocked) {
        this.unlock();
      } else {
        this.music.play()?.catch?.(() => {
          this.unlocked = false;
        });
      }
    }
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
    this.storage?.setItem("alien-frontiers:sfx", enabled ? "on" : "off");
  }

  bindState(state) {
    this.unbindState();
    const sounds = new Map([
      [EventName.shipsRolled, "roll"],
      [EventName.shipSelected, "select"],
      [EventName.shipsDocked, "dock"],
      [EventName.shipActivated, "ship"],
      [EventName.shipDestroyed, "ship"],
      [EventName.launchColony, "colony"],
      [EventName.techCardsChanged, "card"],
      [EventName.cardTapped, "card"],
    ]);
    for (const [eventName, sound] of sounds) {
      this.unsubscribers.push(state.events.on(eventName, () => this.play(sound)));
    }
    this.unsubscribers.push(state.events.on(EventName.nextPlayer, () => {
      if (state.currentPlayer.aiType === AIType.human) {
        this.play("turn");
      }
    }));
  }

  unbindState() {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers.length = 0;
  }
}