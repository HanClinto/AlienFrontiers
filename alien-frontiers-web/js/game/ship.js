import { EventName } from "./constants.js";

export class Ship {
  constructor(player, shipIndex, state = player?.state) {
    this.player = player;
    this.state = state;
    this.shipIndex = shipIndex;
    this.value = 0;
    this.rollIndex = 0;
    this.dock = null;
    this.isSelected = false;
    this.active = false;
    this.teleportRestriction = null;
  }

  get docked() {
    return this.dock !== null;
  }

  get isArtifactShip() {
    return this.shipIndex === 6;
  }

  roll(random = Math.random) {
    this.value = Math.floor(random() * 6) + 1;
    this.rollIndex += 1;
    this.state.postEvent(EventName.shipRolled, this);
  }

  toggleSelect() {
    this.isSelected = !this.isSelected;
    this.state.postEvent(EventName.shipSelected, this);
  }

  undock() {
    this.dock?.ejectShip();
  }
}