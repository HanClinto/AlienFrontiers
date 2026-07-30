import assert from "node:assert/strict";
import test from "node:test";

import { GameAudioManager } from "../js/audio.js";
import { AIType, EventName } from "../js/game/constants.js";
import { EventBus } from "../js/game/event-bus.js";

class FakeAudio {
  constructor(source) {
    this.source = source;
    this.playCount = 0;
    this.loop = false;
    this.volume = 1;
  }

  play() {
    this.playCount += 1;
    return Promise.resolve();
  }

  cloneNode() {
    return this;
  }
}

test("audio unlock starts music and game events route to original effects", () => {
  const manager = new GameAudioManager(
    new URL("file:///audio/"),
    (source) => new FakeAudio(source),
  );
  const state = {
    events: new EventBus(),
    currentPlayer: { aiType: AIType.human },
  };

  manager.bindState(state);
  state.events.post(EventName.shipsRolled, state.currentPlayer);
  assert.equal(manager.effects.get("roll").playCount, 0);
  manager.unlock();
  assert.equal(manager.music.playCount, 1);
  state.events.post(EventName.shipsRolled, state.currentPlayer);
  state.events.post(EventName.shipsDocked, state.currentPlayer);
  state.events.post(EventName.nextPlayer, state);
  assert.equal(manager.effects.get("roll").playCount, 1);
  assert.equal(manager.effects.get("dock").playCount, 1);
  assert.equal(manager.effects.get("turn").playCount, 1);
});

test("music and SFX preferences persist and suppress playback", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const manager = new GameAudioManager(
    new URL("file:///audio/"),
    (source) => new FakeAudio(source),
    storage,
  );
  manager.unlock();
  manager.setMusicEnabled(false);
  manager.setSfxEnabled(false);
  manager.play("roll");
  assert.equal(manager.music.volume, 0);
  assert.equal(manager.effects.get("roll").playCount, 0);
  assert.equal(values.get("alien-frontiers:music"), "off");
  assert.equal(values.get("alien-frontiers:sfx"), "off");
});