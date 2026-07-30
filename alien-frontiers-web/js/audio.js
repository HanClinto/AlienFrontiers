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
  constructor(baseUrl, audioFactory = (source) => new Audio(source)) {
    this.baseUrl = baseUrl;
    this.audioFactory = audioFactory;
    this.unlocked = false;
    this.unsubscribers = [];
    this.music = this.audioFactory(new URL("music-background.mp3", baseUrl).href);
    this.music.loop = true;
    this.music.volume = 0.25;
    this.effects = new Map(Object.entries(EFFECT_FILES).map(([name, fileName]) => {
      const audio = this.audioFactory(new URL(fileName, baseUrl).href);
      audio.preload = "auto";
      return [name, audio];
    }));
  }

  unlock() {
    if (this.unlocked) {
      return;
    }
    this.unlocked = true;
    this.music.play()?.catch?.(() => {
      this.unlocked = false;
    });
  }

  play(name) {
    if (!this.unlocked) {
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

  bindState(state) {
    this.unbindState();
    const sounds = new Map([
      [EventName.shipsRolled, "roll"],
      [EventName.shipSelected, "select"],
      [EventName.shipsDocked, "dock"],
      [EventName.shipActivated, "ship"],
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