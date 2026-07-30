import { EventName } from "./constants.js";

export class Region {
  constructor(state, title) {
    this.state = state;
    this.title = title;
    this.colonyCounts = [0, 0, 0, 0];
    this.hasPositronField = false;
    this.hasRepulsorField = false;
    this.hasIsolationField = false;
    this.bonusUsedThisTurn = false;
  }

  coloniesForPlayer(playerIndex) {
    return this.colonyCounts[playerIndex];
  }

  get numColonies() {
    return this.colonyCounts
      .slice(0, this.state.numPlayers)
      .reduce((total, count) => total + count, 0);
  }

  get playerWithMajority() {
    const activeCounts = this.colonyCounts.slice(0, this.state.numPlayers);
    const maxColonies = Math.max(...activeCounts);
    if (maxColonies === 0) {
      return -1;
    }
    const leaders = activeCounts
      .map((count, playerIndex) => ({ count, playerIndex }))
      .filter(({ count }) => count === maxColonies);
    return leaders.length === 1 ? leaders[0].playerIndex : -1;
  }

  playerHasBonus(player) {
    return !this.hasIsolationField && this.playerWithMajority === player.playerIndex;
  }

  coloniesNeededForMajority(player) {
    if (this.playerWithMajority === player.playerIndex) {
      return 0;
    }
    const maxColonies = Math.max(...this.colonyCounts.slice(0, this.state.numPlayers));
    return maxColonies - this.coloniesForPlayer(player.playerIndex) + 1;
  }

  addColony(playerIndex) {
    this.colonyCounts[playerIndex] += 1;
    this.state.postEvent(EventName.coloniesChanged, this);
  }

  launchColony(playerIndex) {
    const player = this.state.players[playerIndex];
    if (player.coloniesToLaunch <= 0 || player.coloniesLeft <= 0) {
      return false;
    }
    this.colonyCounts[playerIndex] += 1;
    player.coloniesToLaunch -= 1;
    player.coloniesLeft -= 1;
    this.state.logMove(`${player.playerName}: Landed colony at ${this.title}`);
    this.state.postEvent(EventName.coloniesChanged, this);
    return true;
  }
}

export const REGION_DEFINITIONS = Object.freeze([
  ["heinleinPlains", "Heinlein Plains"],
  ["pohlFoothills", "Pohl Foothills"],
  ["vanVogtMountains", "Van Vogt Mountains"],
  ["bradburyPlateau", "Bradbury Plateau"],
  ["asimovCrater", "Asimov Crater"],
  ["herbertValley", "Herbert Valley"],
  ["lemBadlands", "Lem Badlands"],
  ["burroughsDesert", "Burroughs Desert"],
]);