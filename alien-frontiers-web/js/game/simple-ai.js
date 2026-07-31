import { AIType } from "./constants.js";
import { TechCardType } from "./tech-card.js";

const AI_PROFILES = Object.freeze({
  [AIType.easy]: Object.freeze({ aggression: 0.1, humanPrejudice: 1, randomness: 2 }),
  [AIType.medium]: Object.freeze({ aggression: 0.3, humanPrejudice: 1, randomness: 1 }),
  [AIType.hard]: Object.freeze({ aggression: 0.5, humanPrejudice: 1, randomness: 0 }),
  [AIType.pirate]: Object.freeze({ aggression: 0.9, humanPrejudice: 1.5, randomness: 0 }),
});

const TECH_VALUES = Object.freeze({
  [TechCardType.alienCity]: 1,
  [TechCardType.alienMonument]: 1,
  [TechCardType.boosterPod]: 1.75,
  [TechCardType.plasmaCannon]: 1.5,
  [TechCardType.resourceCache]: 1.2,
  [TechCardType.stasisBeam]: 1.5,
  [TechCardType.gravityManipulator]: 0.25,
  [TechCardType.polarityDevice]: 2,
  [TechCardType.dataCrystal]: 1.5,
  [TechCardType.orbitalTeleporter]: 1.5,
  [TechCardType.holographicDecoy]: 1.5,
});

export class SimpleAI {
  static profileFor(player) {
    return AI_PROFILES[player.aiType] ?? AI_PROFILES[AIType.easy];
  }

  static threatValue(player, profile) {
    const prejudice = player.aiType === AIType.human ? profile.humanPrejudice : 1;
    return player.score * prejudice;
  }

  static step(state) {
    const player = state.currentPlayer;
    if (player.isRaiding) {
      return this.finishRaid(state, player);
    }
    if (!player.initialRollDone) {
      state.rollCurrentPlayerShips();
      return true;
    }

    if (player.coloniesToLaunch > 0) {
      return this.launchColony(state, player);
    }

    if (this.useArtifactCredit(state, player)) {
      return true;
    }

    if (player.ableToMarketTrade && player.effectiveMarketPrice <= 2) {
      return player.doMarketTrade();
    }

    if (state.colonistHub.ableToLaunch(player)) {
      state.colonistHub.launchColony(player);
      this.launchColony(state, player);
      return true;
    }

    if (player.numUndockedShips === 0) {
      return state.gotoNextPlayer();
    }

    const shipsByValue = new Map();
    for (const ship of player.undockedShips) {
      const matchingShips = shipsByValue.get(ship.value) ?? [];
      matchingShips.push(ship);
      shipsByValue.set(ship.value, matchingShips);
    }
    if (state.canPurchaseArtifactShip(player)) {
      state.purchaseArtifactShip(player);
      return true;
    }
    const constructorTriplet = [...shipsByValue.values()].find((ships) =>
      ships.length >= 3
      && state.colonyConstructor.isValidMoveFromPlayer(player, ships.slice(0, 3)));
    if (constructorTriplet) {
      state.colonyConstructor.commitShipsFromPlayer(player, constructorTriplet.slice(0, 3));
      this.launchColony(state, player);
      return true;
    }
    const terraformingShip = player.undockedShips.find((ship) =>
      state.terraformingStation.isValidMoveFromPlayer(player, [ship]));
    if (terraformingShip) {
      state.terraformingStation.commitShipsFromPlayer(player, [terraformingShip]);
      this.launchColony(state, player);
      return true;
    }
    const undocked = player.undockedShips;
    for (let first = 0; first < undocked.length - 2; first += 1) {
      for (let second = first + 1; second < undocked.length - 1; second += 1) {
        for (let third = second + 1; third < undocked.length; third += 1) {
          const straight = [undocked[first], undocked[second], undocked[third]];
          if (state.raidersOutpost.isValidMoveFromPlayer(player, straight)) {
            state.raidersOutpost.commitShipsFromPlayer(player, straight);
            return true;
          }
        }
      }
    }
    const shipyardPair = [...shipsByValue.values()].find((ships) =>
      ships.length >= 2 && state.shipyard.isValidMoveFromPlayer(player, ships.slice(0, 2)));
    if (shipyardPair) {
      state.shipyard.commitShipsFromPlayer(player, shipyardPair.slice(0, 2));
      return true;
    }

    const artifactPair = this.findArtifactPair(state, player);
    if (artifactPair) {
      state.alienArtifact.commitShipsFromPlayer(player, artifactPair);
      return true;
    }

    const marketPair = this.findMarketPair(state, player, shipsByValue);
    if (marketPair) {
      state.orbitalMarket.commitShipsFromPlayer(player, marketPair);
      return true;
    }

    const lunarShips = [...player.undockedShips]
      .sort((left, right) => left.value - right.value)
      .filter((ship) => state.lunarMine.isValidMoveFromPlayer(player, [ship]));
    if (player.ore < 3 && player.ore <= player.fuel && lunarShips.length > 0) {
      if (state.lunarMine.commitShipsFromPlayer(player, [lunarShips[0]])) {
        return true;
      }
    }

    if (player.fuel < 3 && player.undockedShips.length > 0) {
      const highestShip = [...player.undockedShips]
        .sort((left, right) => right.value - left.value)[0];
      if (state.solarConverter.commitShipsFromPlayer(player, [highestShip])) {
        return true;
      }
    }

    const hubGroup = state.colonistHub.dockGroups[player.playerIndex];
    const hubShips = player.undockedShips.slice(0, Math.min(3, hubGroup.numOpenDocks));
    if (state.colonistHub.isValidMoveFromPlayer(player, hubShips)) {
      state.colonistHub.commitShipsFromPlayer(player, hubShips);
      return true;
    }

    return state.maintenanceBay.commitShipsFromPlayer(player, player.undockedShips);
  }

  static findArtifactPair(state, player) {
    if (state.alienArtifact.numEmptyGroups < 2) {
      return null;
    }
    const ships = [...player.undockedShips].sort((left, right) => right.value - left.value);
    for (let first = 0; first < ships.length - 1; first += 1) {
      for (let second = first + 1; second < ships.length; second += 1) {
        const pair = [ships[first], ships[second]];
        if (
          pair[0].value + pair[1].value >= 8
          && state.alienArtifact.isValidMoveFromPlayer(player, pair)
        ) {
          return pair;
        }
      }
    }
    return null;
  }

  static findMarketPair(state, player, shipsByValue) {
    if (player.marketPrice !== 0 || state.orbitalMarket.numEmptyGroups === 0) {
      return null;
    }
    const pairs = [...shipsByValue.entries()]
      .filter(([, ships]) => ships.length >= 2)
      .sort(([leftValue], [rightValue]) => leftValue - rightValue);
    for (const [value, ships] of pairs) {
      const effectivePrice = state.heinleinPlains.playerHasBonus(player) ? 1 : value;
      const pair = ships.slice(0, 2);
      if (
        effectivePrice <= 2
        && player.fuel >= effectivePrice
        && state.orbitalMarket.isValidMoveFromPlayer(player, pair)
      ) {
        return pair;
      }
    }
    return null;
  }

  static useArtifactCredit(state, player) {
    const card = state.techDisplayDeck
      .filter((candidate) => player.canPurchaseCard(candidate))
      .sort((left, right) =>
        (TECH_VALUES[right.type] ?? 0) - (TECH_VALUES[left.type] ?? 0)
        || left.cardID - right.cardID)[0];
    if (card) {
      return player.purchaseCard(card);
    }
    if (player.artifactCreditAvailable >= 8 && player.canShuffleCards) {
      return player.shuffleCards();
    }
    return false;
  }

  static finishRaid(state, player) {
    const profile = this.profileFor(player);
    const victims = state.players
      .filter((victim) => victim !== player)
      .sort((left, right) =>
        this.threatValue(right, profile) - this.threatValue(left, profile));
    for (const victim of victims) {
      for (const resource of ["ore", "fuel"]) {
        while (!player.raidSelectionComplete && player.canRaidMore(victim, resource)) {
          player.adjustRaidResource(victim, resource, 1);
        }
      }
    }
    if (!player.raidSelectionComplete) {
      const card = victims
        .flatMap((victim) => victim.cards)
        .find((candidate) => player.canRaidCard(candidate));
      if (card) {
        player.selectRaidCard(card);
      }
    }
    if (player.raidSelectionComplete) {
      return player.finishRaid();
    }
    player.isRaiding = false;
    player.cardToRaid = null;
    state.postEvent("finish-raid", player);
    return true;
  }

  static launchColony(state, player) {
    const legalRegions = state.regions.filter((region) => !region.hasRepulsorField);
    const profile = this.profileFor(player);
    const choices = legalRegions.map((region, index) => {
      const coloniesNeeded = region.coloniesNeededForMajority(player);
      const majorityValue = coloniesNeeded === 1 ? 100
        : coloniesNeeded === 2 ? 30
          : coloniesNeeded === 0 ? 10 : 10 - coloniesNeeded;
      const leader = region.playerWithMajority >= 0
        ? state.players[region.playerWithMajority]
        : null;
      const denialValue = leader && leader !== player
        ? this.threatValue(leader, profile) * profile.aggression
        : 0;
      const noise = profile.randomness > 0
        ? (state.random() * 2 - 1) * profile.randomness
        : 0;
      return { region, score: majorityValue + denialValue + noise, index };
    });
    const choice = choices.sort((left, right) =>
      right.score - left.score || left.index - right.index)[0];
    return choice ? state.selectRegion(choice.region) : false;
  }
}
