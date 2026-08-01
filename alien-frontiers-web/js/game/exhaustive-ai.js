import { AIType } from "./constants.js";
import { createGameSnapshot, restoreGameSnapshot, restoreGameSnapshotInto } from "./game-persistence.js";
import { TechCardType } from "./tech-card.js";

const PERSONALITIES = Object.freeze({
  [AIType.easy]: Object.freeze({ aggression: 0.1, humanPrejudice: 1, randomRange: 0.02 }),
  [AIType.medium]: Object.freeze({ aggression: 0.3, humanPrejudice: 1, randomRange: 0.01 }),
  [AIType.hard]: Object.freeze({ aggression: 0.5, humanPrejudice: 1, randomRange: 0 }),
  [AIType.pirate]: Object.freeze({ aggression: 0.9, humanPrejudice: 1.5, randomRange: 0 }),
});

export const AI_SEARCH_BUDGETS_MS = Object.freeze({
  [AIType.easy]: 4_400,
  [AIType.medium]: 4_400,
  [AIType.hard]: 7_400,
  [AIType.pirate]: 7_400,
});

export const LEGACY_COMPACT_PROFILES = Object.freeze({
  desktop: Object.freeze({
    policy: "legacy-compact",
    maxNodes: 12_800,
    maxDepth: 100,
    maxChildren: 800,
  }),
  mobile: Object.freeze({
    policy: "legacy-compact",
    maxNodes: 6_400,
    maxDepth: 100,
    maxChildren: 800,
  }),
});

const TECH_VALUES = Object.freeze({
  [TechCardType.alienCity]: -1,
  [TechCardType.alienMonument]: -1,
  [TechCardType.boosterPod]: 0.75,
  [TechCardType.plasmaCannon]: 1.5,
  [TechCardType.resourceCache]: 0.3,
  [TechCardType.stasisBeam]: 0.5,
  [TechCardType.gravityManipulator]: 0.25,
  [TechCardType.polarityDevice]: 1,
  [TechCardType.dataCrystal]: 1.5,
  [TechCardType.orbitalTeleporter]: 1.5,
  [TechCardType.holographicDecoy]: 1.5,
  [TechCardType.temporalWarper]: 1,
});

const SEARCH_ORBITAL_KEYS = Object.freeze([
  "solarConverter",
  "maintenanceBay",
  "lunarMine",
  "shipyard",
  "orbitalMarket",
  "colonyConstructor",
  "alienArtifact",
  "raidersOutpost",
  "colonistHub",
  "terraformingStation",
]);
const MAX_PLAYERS = 4;
const NATIVE_SHIPS_PER_PLAYER = 6;
const MAX_TECH_CARDS = 22;
const PACKED_CARD_SEQUENCE_WORDS = 5;
const SEARCH_POSITION_WORDS = 85;

function packedShip(ship, orbitalIDs) {
  const dockID = ship.dock ? orbitalIDs.get(ship.dock.orbital) : 0;
  const restrictionID = ship.teleportRestriction ? orbitalIDs.get(ship.teleportRestriction) : 0;
  return (
    ship.value
    | (Number(ship.active) << 3)
    | (Number(ship.isSelected) << 4)
    | (dockID << 5)
    | (restrictionID << 9)
  ) >>> 0;
}

function writeCardSequence(words, index, cards) {
  words[index] = cards.length;
  for (let wordIndex = 0; wordIndex < PACKED_CARD_SEQUENCE_WORDS - 1; wordIndex += 1) {
    let word = 0;
    for (let slot = 0; slot < 6; slot += 1) {
      const cardID = cards[wordIndex * 6 + slot]?.cardID ?? 0;
      word |= cardID << (slot * 5);
    }
    words[index + wordIndex + 1] = word >>> 0;
  }
  return index + PACKED_CARD_SEQUENCE_WORDS;
}

function hashPositionWords(words) {
  let hash = 0x811C9DC5;
  for (const word of words) {
    hash = Math.imul(hash ^ word, 0x01000193) >>> 0;
  }
  return hash;
}

function fingerprintPositionWords(words) {
  let high = 0x9E3779B9;
  for (const word of words) {
    high = Math.imul(high ^ word, 0x85EBCA6B) >>> 0;
    high ^= high >>> 13;
  }
  return (BigInt(high >>> 0) << 32n) | BigInt(hashPositionWords(words));
}

function raidResourceOutcomes(state, raider) {
  const sources = state.players
    .filter((victim) => victim !== raider && !victim.hasHolographicDecoy)
    .flatMap((victim) => ["ore", "fuel"].map((resource) => ({
      playerIndex: victim.playerIndex,
      resource,
      available: victim[resource],
    })))
    .filter((source) => source.available > 0);
  const totalAvailable = sources.reduce((total, source) => total + source.available, 0);
  const target = Math.min(4, totalAvailable);
  if (target === 0) {
    return [];
  }
  const outcomes = [];
  const allocations = [];
  const visit = (sourceIndex, remaining) => {
    if (sourceIndex === sources.length) {
      if (remaining === 0) {
        outcomes.push(allocations.filter((allocation) => allocation.amount > 0));
      }
      return;
    }
    const source = sources[sourceIndex];
    const maximum = Math.min(source.available, remaining);
    for (let amount = 0; amount <= maximum; amount += 1) {
      allocations.push({ ...source, amount });
      visit(sourceIndex + 1, remaining - amount);
      allocations.pop();
    }
  };
  visit(0, target);
  return outcomes;
}

function raidOutcomes(state, raider) {
  const cardOutcomes = state.players
    .filter((victim) => victim !== raider)
    .flatMap((victim) => victim.cards)
    .filter((card) => raider.canRaidCard(card))
    .map((card) => ({ type: "card", cardID: card.cardID }));
  const resourceOutcomes = raidResourceOutcomes(state, raider)
    .map((allocations) => ({ type: "resources", allocations }));
  return [...cardOutcomes, ...resourceOutcomes, ...(cardOutcomes.length + resourceOutcomes.length === 0
    ? [{ type: "none" }]
    : [])];
}

function legacyRaidOutcomes(state, raider) {
  const cardOutcomes = state.players
    .filter((victim) => victim !== raider)
    .flatMap((victim) => victim.cards)
    .filter((card) => raider.canRaidCard(card))
    .map((card) => ({ type: "card", cardID: card.cardID }));
  const victims = [...state.players]
    .filter((victim) => victim !== raider && !victim.hasHolographicDecoy)
    .sort((left, right) => right.score - left.score);
  const resourceOutcomes = [];
  const seenAllocations = new Set();
  for (let targetOre = 4; targetOre >= 0; targetOre -= 1) {
    const targets = { ore: targetOre, fuel: 4 - targetOre };
    const totals = { ore: 0, fuel: 0 };
    const allocations = [];
    for (const victim of victims) {
      for (const resource of ["ore", "fuel"]) {
        const amount = Math.min(targets[resource] - totals[resource], victim[resource]);
        if (amount > 0) {
          allocations.push({
            playerIndex: victim.playerIndex,
            resource,
            available: victim[resource],
            amount,
          });
          totals[resource] += amount;
        }
      }
    }
    if (allocations.length > 0) {
      const key = allocations
        .map(({ playerIndex, resource, amount }) => `${playerIndex}:${resource}:${amount}`)
        .join("|");
      if (!seenAllocations.has(key)) {
        seenAllocations.add(key);
        resourceOutcomes.push({ type: "resources", allocations });
      }
    }
  }
  return [...cardOutcomes, ...resourceOutcomes, ...(cardOutcomes.length + resourceOutcomes.length === 0
    ? [{ type: "none" }]
    : [])];
}

function scoreRaidOutcome(state, outcome) {
  const raider = state.currentPlayer;
  if (outcome.type === "resources") {
    for (const allocation of outcome.allocations) {
      const victim = state.players[allocation.playerIndex];
      raider[allocation.resource] += allocation.amount;
      victim[allocation.resource] -= allocation.amount;
    }
    const score = evaluateExhaustiveState(state, state.currentPlayerIndex);
    for (const allocation of outcome.allocations) {
      const victim = state.players[allocation.playerIndex];
      raider[allocation.resource] -= allocation.amount;
      victim[allocation.resource] += allocation.amount;
    }
    return score;
  }
  if (outcome.type === "card") {
    const card = state.allTech.find((candidate) => candidate.cardID === outcome.cardID);
    const victim = card.owner;
    const victimIndex = victim.cards.indexOf(card);
    const duplicate = raider.cards.some((ownedCard) => ownedCard.type === card.type);
    victim.cards.splice(victimIndex, 1);
    if (!duplicate) {
      raider.cards.push(card);
      card.owner = raider;
    } else {
      card.owner = null;
    }
    const score = evaluateExhaustiveState(state, state.currentPlayerIndex);
    if (!duplicate) {
      raider.cards.pop();
    }
    victim.cards.splice(victimIndex, 0, card);
    card.owner = victim;
    return score;
  }
  return evaluateExhaustiveState(state, state.currentPlayerIndex);
}

function rankedRaidOutcomes(state, raider, maximum) {
  return raidOutcomes(state, raider)
    .map((outcome, index) => ({ outcome, index, score: scoreRaidOutcome(state, outcome) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, maximum)
    .map(({ outcome }) => outcome);
}

function resolveRaidOutcome(state, outcome) {
  const raider = state.currentPlayer;
  if (!raider.isRaiding) {
    return false;
  }
  if (outcome.type === "card") {
    const card = state.allTech.find((candidate) => candidate.cardID === outcome.cardID);
    return raider.selectRaidCard(card) && raider.finishRaid();
  }
  if (outcome.type === "resources") {
    for (const allocation of outcome.allocations) {
      const victim = state.players[allocation.playerIndex];
      for (let count = 0; count < allocation.amount; count += 1) {
        if (!raider.adjustRaidResource(victim, allocation.resource, 1)) {
          return false;
        }
      }
    }
    return raider.finishRaid();
  }
  return raider.cancelRaid();
}

function techPowerMoves(state) {
  const player = state.currentPlayer;
  const moves = [];
  for (const card of player.cards) {
    if (card.type === TechCardType.temporalWarper) {
      continue;
    }
    if (card.type === TechCardType.gravityManipulator && card.canUsePower) {
      for (const shipToRaise of player.undockedShips) {
        if (!card.canUsePowerOnShip(shipToRaise)) {
          continue;
        }
        for (const shipToLower of player.undockedShips) {
          if (card.canLowerGravityShip(shipToLower, shipToRaise)) {
            moves.push({
              type: "tech-gravity",
              cardID: card.cardID,
              raiseShipIndex: shipToRaise.shipIndex,
              lowerShipIndex: shipToLower.shipIndex,
            });
          }
        }
      }
      continue;
    }
    if (card.type === TechCardType.dataCrystal) {
      for (let regionIndex = 0; regionIndex < state.regions.length; regionIndex += 1) {
        if (card.canUsePowerOnRegion(state.regions[regionIndex])) {
          moves.push({ type: "tech-region", cardID: card.cardID, regionIndex });
        }
      }
      continue;
    }
    if (card.type === TechCardType.plasmaCannon && !card.tapped) {
      for (const orbitalKey of SEARCH_ORBITAL_KEYS) {
        const targets = state[orbitalKey].docks
          .map((dock) => dock.dockedShip)
          .filter((ship) => card.canTargetPlasmaShip(ship));
        const subsetCount = 2 ** targets.length;
        for (let mask = 1; mask < subsetCount; mask += 1) {
          const ships = targets.filter((_ship, index) => mask & (1 << index));
          if (ships.every((ship, index) => card.canTargetPlasmaShip(ship, ships.slice(0, index)))) {
            moves.push({
              type: "tech-plasma",
              cardID: card.cardID,
              targets: ships.map((ship) => ({
                playerIndex: ship.player.playerIndex,
                shipIndex: ship.shipIndex,
              })),
            });
          }
        }
      }
      continue;
    }
    const candidateShips = card.type === TechCardType.orbitalTeleporter
      ? player.activeShips
      : player.undockedShips;
    for (const ship of candidateShips) {
      if (card.canUsePowerOnShip(ship)) {
        moves.push({ type: "tech-ship", cardID: card.cardID, shipIndex: ship.shipIndex });
      }
    }
  }
  return moves;
}

function executeTechPowerMove(state, move) {
  const card = state.allTech.find((candidate) => candidate.cardID === move.cardID);
  if (!card || card.owner !== state.currentPlayer) {
    return false;
  }
  if (move.type === "tech-region") {
    return card.usePowerOnRegion(state.regions[move.regionIndex]) === true;
  }
  if (move.type === "tech-gravity") {
    const shipToRaise = state.currentPlayer.activeShips.find(
      (ship) => ship.shipIndex === move.raiseShipIndex,
    );
    const shipToLower = state.currentPlayer.activeShips.find(
      (ship) => ship.shipIndex === move.lowerShipIndex,
    );
    return card.useGravityPower(shipToRaise, shipToLower) === true;
  }
  if (move.type === "tech-plasma") {
    const ships = move.targets.map(({ playerIndex, shipIndex }) =>
      state.players[playerIndex].activeShips.find((ship) => ship.shipIndex === shipIndex));
    return ships.every(Boolean) && card.usePlasmaPower(ships) === true;
  }
  const ship = state.currentPlayer.activeShips.find((candidate) =>
    candidate.shipIndex === move.shipIndex);
  return card.usePowerOnShip(ship) === true;
}

function colonySelections(state) {
  return state.regions.flatMap((region, regionIndex) =>
    state.players
      .filter((player) => region.coloniesForPlayer(player.playerIndex) > 0)
      .map((player) => ({ region, regionIndex, player, playerIndex: player.playerIndex })));
}

function techDiscardMoves(state) {
  const moves = [];
  const selections = colonySelections(state);
  for (const card of state.currentPlayer.cards) {
    if (!card.canUseDiscard) {
      continue;
    }
    if (card.hasImplementedRegionDiscard) {
      for (let regionIndex = 0; regionIndex < state.regions.length; regionIndex += 1) {
        const region = state.regions[regionIndex];
        if (card.type !== TechCardType.stasisBeam || !region.hasRepulsorField) {
          moves.push({ type: "discard-region", cardID: card.cardID, regionIndex });
        }
      }
      continue;
    }
    if (card.hasImplementedShipDiscard) {
      for (const player of state.players) {
        for (const ship of player.activeShips) {
          if (card.canDiscardOnShip(ship)) {
            moves.push({
              type: "discard-ship",
              cardID: card.cardID,
              playerIndex: player.playerIndex,
              shipIndex: ship.shipIndex,
            });
          }
        }
      }
      continue;
    }
    if (card.hasImplementedCardDiscard) {
      for (const discardedCard of state.techDiscardDeck) {
        if (card.canClaimDiscardedCard(discardedCard)) {
          moves.push({
            type: "discard-card",
            cardID: card.cardID,
            targetCardID: discardedCard.cardID,
          });
        }
      }
      continue;
    }
    if (card.type === TechCardType.orbitalTeleporter) {
      for (const selection of selections) {
        for (let destinationRegionIndex = 0;
          destinationRegionIndex < state.regions.length;
          destinationRegionIndex += 1) {
          const destination = state.regions[destinationRegionIndex];
          if (selection.region !== destination && !selection.region.hasRepulsorField) {
            moves.push({
              type: "discard-teleporter-colony",
              cardID: card.cardID,
              sourceRegionIndex: selection.regionIndex,
              playerIndex: selection.playerIndex,
              destinationRegionIndex,
            });
          }
        }
      }
      continue;
    }
    if (card.type === TechCardType.polarityDevice) {
      for (let firstIndex = 0; firstIndex < selections.length - 1; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < selections.length; secondIndex += 1) {
          const first = selections[firstIndex];
          const second = selections[secondIndex];
          if (
            first.region !== second.region
            && !first.region.hasRepulsorField
            && !second.region.hasRepulsorField
            && first.player !== second.player
          ) {
            moves.push({
              type: "discard-polarity-colonies",
              cardID: card.cardID,
              firstRegionIndex: first.regionIndex,
              firstPlayerIndex: first.playerIndex,
              secondRegionIndex: second.regionIndex,
              secondPlayerIndex: second.playerIndex,
            });
          }
        }
      }
    }
  }
  return moves;
}

function legacyTechDiscardMoves(state) {
  const player = state.currentPlayer;
  const moves = [];
  for (const card of player.cards) {
    if (!card.canUseDiscard) {
      continue;
    }
    if (card.type === TechCardType.stasisBeam) {
      for (let regionIndex = 0; regionIndex < state.regions.length; regionIndex += 1) {
        const region = state.regions[regionIndex];
        if (
          region.playerWithMajority >= 0
          && region.playerWithMajority !== player.playerIndex
          && !region.hasRepulsorField
        ) {
          moves.push({ type: "discard-region", cardID: card.cardID, regionIndex });
        }
      }
    } else if (card.type === TechCardType.dataCrystal && player.coloniesLeft === 1) {
      const regionIndex = state.regions.findIndex((region) =>
        region.playerWithMajority === player.playerIndex);
      if (regionIndex >= 0) {
        moves.push({ type: "discard-region", cardID: card.cardID, regionIndex });
      }
    } else if (card.type === TechCardType.temporalWarper) {
      for (const discardedCard of state.techDiscardDeck) {
        if (card.canClaimDiscardedCard(discardedCard)) {
          moves.push({
            type: "discard-card",
            cardID: card.cardID,
            targetCardID: discardedCard.cardID,
          });
        }
      }
    }
  }
  return moves;
}

function executeTechDiscardMove(state, move) {
  const card = state.allTech.find((candidate) => candidate.cardID === move.cardID);
  if (!card || card.owner !== state.currentPlayer) {
    return false;
  }
  if (move.type === "discard-region") {
    return card.useDiscardOnRegion(state.regions[move.regionIndex]) === true;
  }
  if (move.type === "discard-ship") {
    const ship = state.players[move.playerIndex].activeShips.find(
      (candidate) => candidate.shipIndex === move.shipIndex,
    );
    return card.useDiscardOnShip(ship) === true;
  }
  if (move.type === "discard-card") {
    const target = state.allTech.find((candidate) => candidate.cardID === move.targetCardID);
    return card.useDiscardOnCard(target) === true;
  }
  if (move.type === "discard-teleporter-colony") {
    const selection = {
      region: state.regions[move.sourceRegionIndex],
      player: state.players[move.playerIndex],
    };
    return card.useTeleporterColonyDiscard(
      selection,
      state.regions[move.destinationRegionIndex],
    ) === true;
  }
  if (move.type === "discard-polarity-colonies") {
    return card.usePolarityColonyDiscard(
      {
        region: state.regions[move.firstRegionIndex],
        player: state.players[move.firstPlayerIndex],
      },
      {
        region: state.regions[move.secondRegionIndex],
        player: state.players[move.secondPlayerIndex],
      },
    ) === true;
  }
  return false;
}

function rankedTechDiscardChildren(
  state,
  moves,
  maximumPerType,
  cloneState,
  releaseState,
) {
  const candidatesByType = new Map();
  for (const move of moves) {
    const childState = cloneState(state);
    if (!executeTechDiscardMove(childState, move)) {
      releaseState(childState);
      continue;
    }
    const candidates = candidatesByType.get(move.type) ?? [];
    candidates.push({
      state: childState,
      move,
      positionKey: exhaustivePositionKey(childState),
      score: evaluateExhaustiveState(childState, childState.currentPlayerIndex),
    });
    candidatesByType.set(move.type, candidates);
  }
  return [...candidatesByType.values()].flatMap((candidates) => {
    const ranked = candidates.sort((left, right) => right.score - left.score);
    const retained = ranked.slice(0, maximumPerType);
    for (const candidate of ranked.slice(maximumPerType)) {
      releaseState(candidate.state);
    }
    return retained;
  });
}

export function exhaustivePositionKeysEqual(left, right) {
  if (left.hash !== right.hash) {
    return false;
  }
  for (let index = 0; index < SEARCH_POSITION_WORDS; index += 1) {
    if (left.words[index] !== right.words[index]) {
      return false;
    }
  }
  return true;
}

export function exhaustivePositionKey(state) {
  const words = new Uint32Array(SEARCH_POSITION_WORDS);
  const orbitalIDs = new Map(SEARCH_ORBITAL_KEYS.map((key, index) => [state[key], index + 1]));
  let index = 0;
  words[index++] = state.numPlayers | (state.currentPlayerIndex << 3);
  words[index++] = state.numTurns >>> 0;

  for (let playerIndex = 0; playerIndex < MAX_PLAYERS; playerIndex += 1) {
    const player = state.players[playerIndex];
    if (!player) {
      index += 3 + NATIVE_SHIPS_PER_PLAYER;
      continue;
    }
    words[index++] = (
      player.aiType
      | (Number(player.initialRollDone) << 3)
      | (player.coloniesLeft << 4)
      | (player.coloniesToLaunch << 8)
      | (player.marketPrice << 12)
      | (player.techsDiscarded << 15)
      | ((state.regions.indexOf(player.borrowingRegion) + 1) << 17)
      | (player.activeNativeShips.length << 21)
      | (player.inactiveShips.length << 24)
    ) >>> 0;
    words[index++] = (player.fuel | (player.ore << 16)) >>> 0;
    words[index++] = (
      player.artifactCreditAvailable | (player.artifactShufflesAvailable << 16)
    ) >>> 0;
    const ships = player.allShips
      .filter((ship) => !ship.isArtifactShip)
      .map((ship) => packedShip(ship, orbitalIDs))
      .sort((left, right) => left - right);
    for (let shipIndex = 0; shipIndex < NATIVE_SHIPS_PER_PLAYER; shipIndex += 1) {
      words[index++] = ships[shipIndex] ?? 0;
    }
  }

  const artifactOwner = state.artifactShip.player?.playerIndex;
  words[index++] = (
    packedShip(state.artifactShip, orbitalIDs)
    | ((artifactOwner === undefined ? 0 : artifactOwner + 1) << 13)
  ) >>> 0;

  for (const region of state.regions) {
    let word = 0;
    for (let playerIndex = 0; playerIndex < MAX_PLAYERS; playerIndex += 1) {
      word |= region.colonyCounts[playerIndex] << (playerIndex * 4);
    }
    word |= Number(region.hasPositronField) << 16;
    word |= Number(region.hasRepulsorField) << 17;
    word |= Number(region.hasIsolationField) << 18;
    word |= Number(region.bonusUsedThisTurn) << 19;
    words[index++] = word >>> 0;
  }

  words[index++] = state.colonistHub.colonyPositions.reduce(
    (word, position, playerIndex) => word | (position << (playerIndex * 4)),
    state.colonistHub.advancementThisTurn << 16,
  ) >>> 0;

  for (let playerIndex = 0; playerIndex < MAX_PLAYERS; playerIndex += 1) {
    index = writeCardSequence(words, index, state.players[playerIndex]?.cards ?? []);
  }

  let tappedCards = 0;
  let selectedCards = 0;
  for (const card of state.allTech) {
    tappedCards |= Number(card.tapped) << card.cardID;
    selectedCards |= Number(card.isSelected) << card.cardID;
  }
  words[index++] = tappedCards >>> 0;
  words[index++] = selectedCards >>> 0;
  index = writeCardSequence(words, index, state.techDrawDeck);
  index = writeCardSequence(words, index, state.techDiscardDeck);
  index = writeCardSequence(words, index, state.techDisplayDeck);

  if (index !== SEARCH_POSITION_WORDS || state.allTech.length > MAX_TECH_CARDS) {
    throw new Error("ExhaustiveAI position layout is out of sync with the game model");
  }
  return { hash: hashPositionWords(words), words };
}

class PositionSet {
  constructor() {
    this.buckets = new Map();
    this.size = 0;
  }

  add(key) {
    const bucket = this.buckets.get(key.hash);
    if (bucket?.some((candidate) => exhaustivePositionKeysEqual(candidate, key))) {
      return false;
    }
    if (bucket) {
      bucket.push(key);
    } else {
      this.buckets.set(key.hash, [key]);
    }
    this.size += 1;
    return true;
  }
}

class CompactPositionSet {
  constructor() {
    this.fingerprints = new Set();
    this.size = 0;
  }

  add(key) {
    const fingerprint = fingerprintPositionWords(key.words);
    if (this.fingerprints.has(fingerprint)) {
      return false;
    }
    this.fingerprints.add(fingerprint);
    this.size += 1;
    return true;
  }
}

class GameStateArena {
  constructor() {
    this.free = [];
    this.created = 0;
    this.inUse = 0;
    this.peakInUse = 0;
  }

  acquire(source) {
    return this.acquireSnapshot(createGameSnapshot(source));
  }

  acquireSnapshot(snapshot) {
    const neutralRandom = () => 0.5;
    const state = this.free.pop();
    const restored = state
      ? restoreGameSnapshotInto(state, snapshot, neutralRandom, neutralRandom)
      : restoreGameSnapshot(snapshot, neutralRandom, neutralRandom);
    if (!state) {
      this.created += 1;
    }
    this.inUse += 1;
    this.peakInUse = Math.max(this.peakInUse, this.inUse);
    return restored;
  }

  release(state) {
    this.free.push(state);
    this.inUse -= 1;
  }
}

function createSearchSnapshot(state) {
  const snapshot = createGameSnapshot(state);
  snapshot.gameLog = [];
  return snapshot;
}

function stableValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function canonicalShip(ship) {
  return {
    value: ship.value,
    active: ship.active,
    isSelected: ship.isSelected,
    dock: ship.dock?.orbital ?? null,
    teleportRestriction: ship.teleportRestriction ?? null,
  };
}

function compareCanonical(left, right) {
  return JSON.stringify(stableValue(left)).localeCompare(JSON.stringify(stableValue(right)));
}

function searchSnapshot(state) {
  const snapshot = createGameSnapshot(state);
  delete snapshot.gameLog;
  for (const player of snapshot.players) {
    delete player.selectedCard;
    player.activeNativeShipCount = player.activeShipIDs.length;
    player.inactiveNativeShipCount = player.inactiveShipIDs.length;
    delete player.activeShipIDs;
    delete player.inactiveShipIDs;
    player.ships = player.ships.map(canonicalShip).sort(compareCanonical);
  }
  snapshot.artifactShip = {
    ...canonicalShip(snapshot.artifactShip),
    playerIndex: snapshot.artifactShip.playerIndex,
  };
  return snapshot;
}

export function exhaustiveStateKey(state) {
  return JSON.stringify(stableValue(searchSnapshot(state)));
}

function estimatedTurnsLeft(state) {
  return Math.min(...state.players.map((player) => player.coloniesLeft));
}

function playerValue(state, player, options = {}) {
  if (state.gameOver) {
    const winValue = options.winValue ?? 1_000_000;
    return state.winningPlayers[0] === player ? winValue : -winValue;
  }
  const turnsLeft = estimatedTurnsLeft(state);
  const startingColonies = 10 - state.numPlayers;
  const terraformedShip = state.terraformingStation.docks[0]?.dockedShip;
  const countedShips = player.activeShips.length
    - (terraformedShip?.player === player ? 1 : 0);
  const hasRegionBonus = (region) => options.legacyParity
    ? region.playerWithMajority === player.playerIndex && !region.hasIsolationField
    : region.playerHasBonus(player);
  let value = 0;
  value += 0.3 * (6 - 18 / (player.fuel + 3));
  value += 0.9 * (6 - 18 / (player.ore + 3));
  value += countedShips * (11 + 0.25 * turnsLeft);
  value += player.cards.length * ((options.techBaseValue ?? -0.25) + 0.1 * turnsLeft);
  value += 12 * (startingColonies - player.coloniesLeft + player.coloniesToLaunch);
  value += player.vps;
  value += 0.05 * state.lunarMine.docks.reduce(
    (maximum, dock) => Math.max(maximum, dock.dockedShip?.value ?? 0),
    0,
  );
  value += state.colonistHub.colonyPosition(player.playerIndex);
  if (options.includeRegionBonuses !== false && hasRegionBonus(state.heinleinPlains)) {
    value += 0.1 * (0.9 - 0.3) * turnsLeft;
  }
  if (options.includeRegionBonuses !== false && hasRegionBonus(state.pohlFoothills)) {
    value += 0.3 * 0.3 * turnsLeft * player.cards.length;
  }
  if (options.includeRegionBonuses !== false && hasRegionBonus(state.vanVogtMountains)) {
    value += 0.3 * 0.9 * turnsLeft;
  }
  if (options.includeRegionBonuses !== false && hasRegionBonus(state.bradburyPlateau)) {
    value += 0.25 * 0.9 * player.coloniesLeft;
  }
  if (options.includeRegionBonuses !== false && hasRegionBonus(state.asimovCrater)) {
    value += 0.3 * turnsLeft;
  }
  if (options.includeRegionBonuses !== false && hasRegionBonus(state.herbertValley)) {
    value += 0.9 * (0.3 + 0.9) * (6 - player.activeNativeShips.length);
  }
  if (options.includeRegionBonuses !== false && hasRegionBonus(state.lemBadlands)) {
    value += 0.9 * 0.3 * turnsLeft;
  }
  if (options.includeRegionBonuses !== false && hasRegionBonus(state.burroughsDesert)) {
    value += 0.15 * ((11 - 4) - 0.9 - 0.3);
  }
  for (const card of player.cards) {
    value += card.type === TechCardType.resourceCache && options.legacyParity
      ? 0.3 * turnsLeft
      : TECH_VALUES[card.type] ?? 0;
  }
  if (player.cards.some((card) => [
    TechCardType.boosterPod,
    TechCardType.stasisBeam,
    TechCardType.polarityDevice,
  ].includes(card.type))) {
    value += 1;
  }
  if (
    player.activeShips.some((ship) => ship.isArtifactShip)
    && !(options.legacyParity && terraformedShip?.isArtifactShip && terraformedShip.player === player)
  ) {
    value -= 4;
  }
  return value;
}

export function evaluateExhaustiveStateWithoutRegionBonuses(state, playerIndex, random = () => 0.5) {
  return evaluateExhaustiveState(state, playerIndex, random, { includeRegionBonuses: false });
}

export function evaluateLegacyParityState(state, playerIndex, random = () => 0.5) {
  return evaluateExhaustiveState(state, playerIndex, random, {
    unfinishedPenalty: 3,
    legacyParity: true,
    winValue: 1_000,
  });
}

export function evaluateExhaustiveState(
  state,
  playerIndex,
  random = () => 0.5,
  options = {},
) {
  const player = state.players[playerIndex];
  const profile = PERSONALITIES[player.aiType] ?? PERSONALITIES[AIType.easy];
  if (state.gameOver && !options.legacyParity) {
    const winValue = options.winValue ?? 1_000_000;
    return state.winningPlayers[0] === player ? winValue : -winValue;
  }
  const playerValueOptions = {
    ...options,
    techBaseValue: options.legacyParity && player.aiType === AIType.medium ? 0.1 : -0.25,
  };
  const valueForPlayer = (candidate) => playerValue(state, candidate, playerValueOptions);
  const myValue = valueForPlayer(player);
  const opponentValue = Math.max(...state.players
    .filter((candidate) => candidate !== player)
    .map((candidate) => valueForPlayer(candidate)
      * (candidate.aiType === AIType.human ? profile.humanPrejudice : 1)));
  const randomInfluence = (random() * 2 - 1) * profile.randomRange;
  const unfinishedPenalty = player.numUndockedShips > 0
    ? (options.unfinishedPenalty ?? 10_000)
    : 0;
  return myValue - opponentValue * profile.aggression + randomInfluence - unfinishedPenalty;
}

export class ExhaustiveAI {
  static legacyCompactOptionsFor(state, deviceClass = "desktop") {
    return {
      ...LEGACY_COMPACT_PROFILES[deviceClass],
      timeBudgetMs: AI_SEARCH_BUDGETS_MS[state.currentPlayer.aiType]
        ?? AI_SEARCH_BUDGETS_MS[AIType.easy],
    };
  }

  static searchOptionsFor(state) {
    return {
      timeBudgetMs: AI_SEARCH_BUDGETS_MS[state.currentPlayer.aiType]
        ?? AI_SEARCH_BUDGETS_MS[AIType.easy],
      maxNodes: 100_000,
      maxDepth: 10,
      beamWidth: 80,
      maxChildren: 256,
    };
  }

  static think(state, options = {}) {
    const searchOptions = { ...this.searchOptionsFor(state), ...options };
    const workerFactory = options.workerFactory
      ?? (() => {
        const moduleUrl = new URL(import.meta.url);
        const workerUrl = new URL("./exhaustive-ai-worker.js", moduleUrl);
        const version = moduleUrl.searchParams.get("v");
        if (version) {
          workerUrl.searchParams.set("v", version);
        }
        return new Worker(workerUrl, { type: "module" });
      });
    const setTimer = options.setTimer ?? setTimeout;
    const clearTimer = options.clearTimer ?? clearTimeout;
    const watchdogMs = options.watchdogMs ?? searchOptions.timeBudgetMs + 1_000;
    return new Promise((resolve) => {
      let worker;
      try {
        worker = workerFactory();
      } catch (error) {
        resolve({
          move: null,
          fallbackRequired: true,
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }
      let settled = false;
      let watchdog = null;
      const finish = (result) => {
        if (settled) {
          return;
        }
        settled = true;
        if (watchdog !== null) {
          clearTimer(watchdog);
        }
        worker.terminate();
        resolve(result);
      };
      watchdog = setTimer(() => finish({ move: null, fallbackRequired: true, watchdog: true }), watchdogMs);
      options.signal?.addEventListener("abort", () => {
        finish({ move: null, fallbackRequired: true, aborted: true });
      }, { once: true });
      if (options.signal?.aborted) {
        finish({ move: null, fallbackRequired: true, aborted: true });
        return;
      }
      worker.addEventListener("message", (event) => {
        finish(event.data.error
          ? { move: null, fallbackRequired: true, error: event.data.error }
          : event.data.result);
      }, { once: true });
      worker.addEventListener("error", (event) => {
        finish({ move: null, fallbackRequired: true, error: event.message });
      }, { once: true });
      worker.postMessage({
        snapshot: createGameSnapshot(state),
        options: {
          policy: searchOptions.policy ?? "generic",
          timeBudgetMs: searchOptions.timeBudgetMs,
          maxNodes: searchOptions.maxNodes,
          maxDepth: searchOptions.maxDepth,
          beamWidth: searchOptions.beamWidth,
          maxChildren: searchOptions.maxChildren,
          includeColonyMoves: searchOptions.includeColonyMoves,
          includeRaidArtifactMoves: searchOptions.includeRaidArtifactMoves,
          includeTechPowerMoves: searchOptions.includeTechPowerMoves,
          includeTechDiscardMoves: searchOptions.includeTechDiscardMoves,
          maxTechDiscardMovesPerType: searchOptions.maxTechDiscardMovesPerType,
          maxRaidOutcomes: searchOptions.maxRaidOutcomes,
        },
      });
    });
  }

  static orbitalMoves(state, options = {}) {
    const maxChildren = options.maxChildren ?? 96;
    const shouldContinue = options.shouldContinue ?? (() => true);
    const includeColonyMoves = options.includeColonyMoves ?? true;
    const includeRaidArtifactMoves = options.includeRaidArtifactMoves ?? false;
    const includeTechPowerMoves = options.includeTechPowerMoves ?? false;
    const includeTechDiscardMoves = options.includeTechDiscardMoves ?? false;
    const maxTechDiscardMovesPerType = options.maxTechDiscardMovesPerType
      ?? Number.POSITIVE_INFINITY;
    const legacyParity = options.legacyParity ?? false;
    const cloneState = options.cloneState
      ?? ((source) => restoreGameSnapshot(createGameSnapshot(source)));
    const releaseState = options.releaseState ?? (() => {});
    const maxRaidOutcomes = options.maxRaidOutcomes ?? Number.POSITIVE_INFINITY;
    const player = state.currentPlayer;
    if (player.coloniesToLaunch > 0) {
      if (!includeColonyMoves) {
        return [];
      }
      const children = [];
      for (let regionIndex = 0; regionIndex < state.regions.length; regionIndex += 1) {
        if (!shouldContinue() || children.length >= maxChildren) {
          break;
        }
        const region = state.regions[regionIndex];
        if (region.hasRepulsorField) {
          continue;
        }
        const childState = cloneState(state);
        if (childState.regions[regionIndex].launchColony(childState.currentPlayerIndex)) {
          children.push({
            state: childState,
            move: { type: "launch-colony", regionIndex },
          });
        } else {
          releaseState(childState);
        }
      }
      return children;
    }
    if (
      !player.initialRollDone
      || player.isRaiding
      || state.pendingTechCard
    ) {
      return [];
    }
    const children = [];
    const childKeys = new PositionSet();
    if (includeTechDiscardMoves) {
      const discardMoves = legacyParity ? legacyTechDiscardMoves(state) : techDiscardMoves(state);
      const discardChildren = rankedTechDiscardChildren(
        state,
        discardMoves,
        maxTechDiscardMovesPerType,
        cloneState,
        releaseState,
      );
      for (const child of discardChildren) {
        if (!shouldContinue() || children.length >= maxChildren) {
          for (const remaining of discardChildren.slice(discardChildren.indexOf(child))) {
            releaseState(remaining.state);
          }
          return children;
        }
        if (childKeys.add(child.positionKey)) {
          children.push(child);
        } else {
          releaseState(child.state);
        }
      }
    }
    if (includeTechPowerMoves) {
      for (const move of techPowerMoves(state)) {
        if (!shouldContinue() || children.length >= maxChildren) {
          return children;
        }
        const childState = cloneState(state);
        if (!executeTechPowerMove(childState, move)) {
          releaseState(childState);
          continue;
        }
        const positionKey = exhaustivePositionKey(childState);
        if (childKeys.add(positionKey)) {
          children.push({ state: childState, move, positionKey });
        } else {
          releaseState(childState);
        }
      }
    }
    if (includeRaidArtifactMoves && state.canPurchaseArtifactShip(player) && shouldContinue()) {
      const childState = cloneState(state);
      if (childState.purchaseArtifactShip(childState.currentPlayer)) {
        const positionKey = exhaustivePositionKey(childState);
        children.push({ state: childState, move: { type: "purchase-artifact-ship" }, positionKey });
        childKeys.add(positionKey);
      } else {
        releaseState(childState);
      }
    }
    const deterministicArtifactRefill = state.techDrawDeck.length > 0
      || state.techDiscardDeck.length === 0;
    if (
      includeRaidArtifactMoves
      && player.artifactCreditAvailable >= 8
      && deterministicArtifactRefill
    ) {
      for (const card of state.techDisplayDeck) {
        if (!shouldContinue() || children.length >= maxChildren) {
          return children;
        }
        if (!player.canPurchaseCard(card)) {
          continue;
        }
        const childState = cloneState(state);
        const childCard = childState.allTech.find((candidate) => candidate.cardID === card.cardID);
        if (!childState.currentPlayer.purchaseCard(childCard)) {
          releaseState(childState);
          continue;
        }
        const positionKey = exhaustivePositionKey(childState);
        if (childKeys.add(positionKey)) {
          children.push({
            state: childState,
            move: { type: "purchase-tech", cardID: card.cardID },
            positionKey,
          });
        } else {
          releaseState(childState);
        }
      }
    }
    if (includeColonyMoves && state.colonistHub.ableToLaunch(player) && shouldContinue()) {
      const childState = cloneState(state);
      if (childState.colonistHub.launchColony(childState.currentPlayer)) {
        const positionKey = exhaustivePositionKey(childState);
        children.push({ state: childState, move: { type: "hub-launch" }, positionKey });
        childKeys.add(positionKey);
      } else {
        releaseState(childState);
      }
    }
    if (player.numUndockedShips === 0) {
      return children;
    }
    const orbitalNames = [
      "solarConverter",
      "lunarMine",
      "shipyard",
      "orbitalMarket",
      "alienArtifact",
      "colonistHub",
      "maintenanceBay",
    ];
    if (legacyParity) {
      orbitalNames.pop();
    }
    if (includeColonyMoves) {
      orbitalNames.splice(4, 0, "colonyConstructor");
      orbitalNames.splice(-1, 0, "terraformingStation");
    }
    const ships = player.undockedShips;
    if (includeRaidArtifactMoves && shouldContinue()) {
      const subsetCount = 2 ** ships.length;
      for (let mask = 1; mask < subsetCount; mask += 1) {
        const selectedShips = ships.filter((_ship, index) => mask & (1 << index));
        if (!state.canCommitShipsTo(state.raidersOutpost, selectedShips)) {
          continue;
        }
        const outcomes = legacyParity
          ? legacyRaidOutcomes(state, player)
          : rankedRaidOutcomes(state, player, maxRaidOutcomes);
        for (const outcome of outcomes) {
          if (!shouldContinue() || children.length >= maxChildren) {
            return children;
          }
          const childState = cloneState(state);
          const childShips = selectedShips.map((ship) =>
            childState.currentPlayer.activeShips.find((candidate) =>
              candidate.shipIndex === ship.shipIndex));
          if (
            childState.raidersOutpost.commitShipsFromPlayer(childState.currentPlayer, childShips)
            && resolveRaidOutcome(childState, outcome)
          ) {
            const positionKey = exhaustivePositionKey(childState);
            if (childKeys.add(positionKey)) {
              children.push({
                state: childState,
                move: {
                  type: "raid",
                  shipIndexes: selectedShips.map((ship) => ship.shipIndex),
                  outcome,
                },
                positionKey,
              });
            } else {
              releaseState(childState);
            }
          } else {
            releaseState(childState);
          }
        }
      }
    }
    for (const orbitalName of orbitalNames) {
      const orbital = state[orbitalName];
      const subsetCount = 2 ** ships.length;
      for (let mask = 1; mask < subsetCount; mask += 1) {
        if (!shouldContinue()) {
          return children;
        }
        const selectedShips = ships.filter((_ship, index) => mask & (1 << index));
        if (
          legacyParity
          && ["solarConverter", "lunarMine", "terraformingStation"].includes(orbitalName)
          && selectedShips.length !== 1
        ) {
          continue;
        }
        if (
          legacyParity
          && orbitalName === "alienArtifact"
          && (selectedShips.length !== 2
            || selectedShips.reduce((total, ship) => total + ship.value, 0) < 8)
        ) {
          continue;
        }
        if (!state.canCommitShipsTo(orbital, selectedShips)) {
          continue;
        }
        const childState = cloneState(state);
        const childShips = selectedShips.map((ship) =>
          childState.currentPlayer.activeShips.find((candidate) =>
            candidate.shipIndex === ship.shipIndex));
        if (!childState[orbitalName].commitShipsFromPlayer(childState.currentPlayer, childShips)) {
          releaseState(childState);
          continue;
        }
        if (legacyParity && orbitalName === "orbitalMarket") {
          const marketPlayer = childState.currentPlayer;
          const maximumTrades = Math.floor(marketPlayer.fuel / marketPlayer.effectiveMarketPrice);
          for (let tradeCount = 1; tradeCount <= maximumTrades; tradeCount += 1) {
            const tradeState = cloneState(childState);
            let traded = true;
            for (let count = 0; count < tradeCount; count += 1) {
              traded = tradeState.currentPlayer.doMarketTrade() && traded;
            }
            if (!traded) {
              releaseState(tradeState);
              continue;
            }
            const positionKey = exhaustivePositionKey(tradeState);
            if (childKeys.add(positionKey)) {
              children.push({
                state: tradeState,
                positionKey,
                move: {
                  type: "market-trade",
                  shipIndexes: selectedShips.map((ship) => ship.shipIndex),
                  tradeCount,
                },
              });
            } else {
              releaseState(tradeState);
            }
          }
          releaseState(childState);
          continue;
        }
        const childKey = exhaustivePositionKey(childState);
        if (!childKeys.add(childKey)) {
          releaseState(childState);
          continue;
        }
        children.push({
          state: childState,
          positionKey: childKey,
          move: {
            type: "orbital",
            orbitalName,
            shipIndexes: selectedShips.map((ship) => ship.shipIndex),
          },
        });
        if (children.length >= maxChildren) {
          return children;
        }
      }
    }
    return children;
  }

  static executeMove(state, move) {
    if (!move) {
      return false;
    }
    if (move.type === "launch-colony") {
      return state.regions[move.regionIndex]?.launchColony(state.currentPlayerIndex) === true;
    }
    if (move.type === "hub-launch") {
      return state.colonistHub.launchColony(state.currentPlayer) === true;
    }
    if (move.type === "purchase-artifact-ship") {
      return state.purchaseArtifactShip(state.currentPlayer) === true;
    }
    if (move.type === "purchase-tech") {
      const card = state.allTech.find((candidate) => candidate.cardID === move.cardID);
      return state.currentPlayer.purchaseCard(card) === true;
    }
    if (move.type === "raid") {
      const ships = move.shipIndexes.map((shipIndex) =>
        state.currentPlayer.activeShips.find((ship) => ship.shipIndex === shipIndex));
      return ships.every(Boolean)
        && state.raidersOutpost.commitShipsFromPlayer(state.currentPlayer, ships) === true
        && resolveRaidOutcome(state, move.outcome);
    }
    if (move.type === "market-trade") {
      const ships = move.shipIndexes.map((shipIndex) =>
        state.currentPlayer.activeShips.find((ship) => ship.shipIndex === shipIndex));
      if (
        !ships.every(Boolean)
        || !state.orbitalMarket.commitShipsFromPlayer(state.currentPlayer, ships)
      ) {
        return false;
      }
      for (let count = 0; count < move.tradeCount; count += 1) {
        if (!state.currentPlayer.doMarketTrade()) {
          return false;
        }
      }
      return true;
    }
    if (move.type?.startsWith("tech-")) {
      return executeTechPowerMove(state, move);
    }
    if (move.type?.startsWith("discard-")) {
      return executeTechDiscardMove(state, move);
    }
    if (move.type === "orbital" || move.orbitalName) {
      const ships = move.shipIndexes.map((shipIndex) =>
        state.currentPlayer.activeShips.find((ship) => ship.shipIndex === shipIndex));
      return ships.every(Boolean)
        && state[move.orbitalName]?.commitShipsFromPlayer(state.currentPlayer, ships) === true;
    }
    return false;
  }

  static step(state, options = {}) {
    const result = this.search(state, {
      generateChildren: (candidate, search) => this.orbitalMoves(candidate, {
        maxChildren: Math.min(options.maxChildren ?? 96, search.remainingNodes),
        shouldContinue: search.shouldContinue,
      }),
      timeBudgetMs: options.timeBudgetMs ?? 20,
      maxNodes: options.maxNodes ?? 400,
      maxDepth: options.maxDepth ?? 4,
      beamWidth: options.beamWidth ?? 20,
      random: state.random,
      ...options,
    });
    return this.executeMove(state, result.move);
  }

  static search(state, options = {}) {
    const playerIndex = state.currentPlayerIndex;
    const generateChildren = options.generateChildren ?? (() => []);
    const evaluate = options.evaluate ?? ((candidate) =>
      evaluateExhaustiveState(candidate, playerIndex, options.random));
    const now = options.now ?? (() => performance.now());
    const deadline = now() + (options.timeBudgetMs ?? 20);
    const maxNodes = options.maxNodes ?? 500;
    const maxDepth = options.maxDepth ?? 3;
    const beamWidth = options.beamWidth ?? 24;
    const distributeChildrenAcrossFrontier = options.distributeChildrenAcrossFrontier ?? false;
    const seen = new PositionSet();
    seen.add(exhaustivePositionKey(state));
    const rootScore = evaluate(state);
    let frontier = [{ state, moves: [], score: rootScore }];
    let bestMove = null;
    let expandedNodes = 0;
    let timedOut = false;

    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
      const next = [];
      const remainingDepths = maxDepth - depth;
      const depthBudget = distributeChildrenAcrossFrontier
        ? Math.max(1, Math.floor((maxNodes - expandedNodes) / remainingDepths))
        : maxNodes - expandedNodes;
      let depthNodes = 0;
      for (let frontierIndex = 0; frontierIndex < frontier.length; frontierIndex += 1) {
        const node = frontier[frontierIndex];
        if (expandedNodes >= maxNodes || now() >= deadline) {
          timedOut = true;
          break;
        }
        const remainingNodes = distributeChildrenAcrossFrontier
          ? depthBudget - depthNodes
          : maxNodes - expandedNodes;
        const remainingFrontier = frontier.length - frontierIndex;
        const nodeBudget = distributeChildrenAcrossFrontier
          ? Math.max(1, Math.floor(remainingNodes / remainingFrontier))
          : remainingNodes;
        const searchContext = {
          shouldContinue: () => expandedNodes < maxNodes && now() < deadline,
          remainingNodes: nodeBudget,
        };
        let nodeChildren = 0;
        for (const child of generateChildren(node.state, searchContext)) {
          if (nodeChildren >= nodeBudget) {
            break;
          }
          if (expandedNodes >= maxNodes) {
            timedOut = true;
            break;
          }
          expandedNodes += 1;
          nodeChildren += 1;
          depthNodes += 1;
          const key = child.positionKey ?? exhaustivePositionKey(child.state);
          if (!seen.add(key)) {
            continue;
          }
          const candidate = {
            state: child.state,
            moves: [...node.moves, child.move],
            score: evaluate(child.state),
          };
          next.push(candidate);
          if (!bestMove || candidate.score > bestMove.score) {
            bestMove = candidate;
          }
          if (now() >= deadline) {
            timedOut = true;
            break;
          }
        }
      }
      frontier = next.sort((left, right) => right.score - left.score).slice(0, beamWidth);
      if (timedOut) {
        break;
      }
    }

    return {
      move: bestMove?.moves[0] ?? null,
      principalVariation: bestMove?.moves ?? [],
      score: bestMove?.score ?? rootScore,
      expandedNodes,
      uniqueStates: seen.size,
      timedOut,
      fallbackRequired: bestMove === null,
    };
  }

  static searchLegacyParity(state, options = {}) {
    const playerIndex = state.currentPlayerIndex;
    const generateChildren = options.generateChildren ?? (() => []);
    const evaluate = options.evaluate ?? ((candidate) =>
      evaluateExhaustiveState(candidate, playerIndex, options.random));
    const now = options.now ?? (() => performance.now());
    const deadline = now() + (options.timeBudgetMs ?? 20);
    const maxNodes = options.maxNodes ?? 400;
    const maxDepth = options.maxDepth ?? 100;
    const seen = new PositionSet();
    seen.add(exhaustivePositionKey(state));
    const rootScore = evaluate(state);
    let frontier = [{ state, moves: [], rootMoveKey: null }];
    let bestByRoot = new Map();
    let completedBestByRoot = new Map();
    let expandedNodes = 0;
    let completedDepth = 0;
    let timedOut = false;

    for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
      const next = [];
      let completedLayer = true;
      for (const node of frontier) {
        if (expandedNodes >= maxNodes || now() >= deadline) {
          completedLayer = false;
          timedOut = true;
          break;
        }
        const searchContext = {
          shouldContinue: () => expandedNodes < maxNodes && now() < deadline,
          remainingNodes: maxNodes - expandedNodes,
        };
        let childIndex = 0;
        for (const child of generateChildren(node.state, searchContext)) {
          if (expandedNodes >= maxNodes || now() >= deadline) {
            completedLayer = false;
            timedOut = true;
            break;
          }
          expandedNodes += 1;
          const positionKey = child.positionKey ?? exhaustivePositionKey(child.state);
          if (!seen.add(positionKey)) {
            continue;
          }
          const moves = [...node.moves, child.move];
          const rootMoveKey = node.rootMoveKey ?? childIndex;
          childIndex += 1;
          const score = evaluate(child.state);
          const currentBest = bestByRoot.get(rootMoveKey);
          if (!currentBest || score > currentBest.score) {
            bestByRoot.set(rootMoveKey, { score, moves });
          }
          next.push({ state: child.state, moves, rootMoveKey });
        }
        if (!completedLayer) {
          break;
        }
      }
      if (completedLayer) {
        completedDepth = depth;
        completedBestByRoot = new Map(bestByRoot);
      } else {
        break;
      }
      frontier = next;
    }

    const candidates = completedBestByRoot.size > 0 ? completedBestByRoot : bestByRoot;
    const bestMove = [...candidates.values()]
      .sort((left, right) => right.score - left.score)[0] ?? null;
    const acceptedMove = bestMove?.score > rootScore ? bestMove : null;
    return {
      move: acceptedMove?.moves[0] ?? null,
      principalVariation: acceptedMove?.moves ?? [],
      score: acceptedMove?.score ?? rootScore,
      expandedNodes,
      uniqueStates: seen.size,
      completedDepth,
      timedOut,
      fallbackRequired: acceptedMove === null,
    };
  }

  static searchLegacyProbe(state, options = {}) {
    const playerIndex = state.currentPlayerIndex;
    const evaluate = options.evaluate ?? ((candidate) =>
      evaluateLegacyParityState(candidate, playerIndex));
    const now = options.now ?? (() => performance.now());
    const deadline = now() + (options.timeBudgetMs ?? 20);
    const maxNodes = options.maxNodes ?? 12_800;
    const maxDepth = options.maxDepth ?? 100;
    const beamWidth = options.beamWidth ?? 48;
    const maxChildren = options.maxChildren ?? 800;
    const arena = new GameStateArena();
    const seen = new PositionSet();
    seen.add(exhaustivePositionKey(state));
    const rootScore = evaluate(state);
    let frontier = [{ state, moves: [], rootMoveKey: null, score: rootScore, owned: false }];
    let bestByRoot = new Map();
    let completedBestByRoot = new Map();
    let expandedNodes = 0;
    let completedDepth = 0;
    let timedOut = false;

    for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
      const next = [];
      let completedLayer = true;
      for (const node of frontier) {
        if (expandedNodes >= maxNodes || now() >= deadline) {
          completedLayer = false;
          timedOut = true;
          break;
        }
        const children = this.orbitalMoves(node.state, {
          maxChildren: Math.min(maxChildren, maxNodes - expandedNodes),
          shouldContinue: () => expandedNodes < maxNodes && now() < deadline,
          includeColonyMoves: true,
          includeRaidArtifactMoves: true,
          includeTechPowerMoves: true,
          includeTechDiscardMoves: true,
          legacyParity: true,
          cloneState: (source) => arena.acquire(source),
          releaseState: (released) => arena.release(released),
        });
        let childIndex = 0;
        for (const child of children) {
          if (expandedNodes >= maxNodes || now() >= deadline) {
            arena.release(child.state);
            completedLayer = false;
            timedOut = true;
            continue;
          }
          expandedNodes += 1;
          const positionKey = child.positionKey ?? exhaustivePositionKey(child.state);
          if (!seen.add(positionKey)) {
            arena.release(child.state);
            continue;
          }
          const moves = [...node.moves, child.move];
          const rootMoveKey = node.rootMoveKey ?? childIndex;
          childIndex += 1;
          const score = evaluate(child.state);
          const currentBest = bestByRoot.get(rootMoveKey);
          if (!currentBest || score > currentBest.score) {
            bestByRoot.set(rootMoveKey, { score, moves });
          }
          next.push({ state: child.state, moves, rootMoveKey, score, owned: true });
        }
        if (node.owned) {
          arena.release(node.state);
          node.owned = false;
        }
      }
      for (const node of frontier) {
        if (node.owned) {
          arena.release(node.state);
          node.owned = false;
        }
      }
      if (completedLayer) {
        completedDepth = depth;
        completedBestByRoot = new Map(bestByRoot);
      }
      const retained = next
        .sort((left, right) => right.score - left.score)
        .slice(0, beamWidth);
      const retainedStates = new Set(retained.map((node) => node.state));
      for (const node of next) {
        if (!retainedStates.has(node.state)) {
          arena.release(node.state);
          node.owned = false;
        }
      }
      frontier = retained;
      if (!completedLayer) {
        break;
      }
    }

    for (const node of frontier) {
      if (node.owned) {
        arena.release(node.state);
      }
    }
    const candidates = completedBestByRoot.size > 0 ? completedBestByRoot : bestByRoot;
    const bestMove = [...candidates.values()]
      .sort((left, right) => right.score - left.score)[0] ?? null;
    const acceptedMove = bestMove?.score > rootScore ? bestMove : null;
    return {
      move: acceptedMove?.moves[0] ?? null,
      principalVariation: acceptedMove?.moves ?? [],
      score: acceptedMove?.score ?? rootScore,
      expandedNodes,
      uniqueStates: seen.size,
      completedDepth,
      timedOut,
      fallbackRequired: acceptedMove === null,
      createdStates: arena.created,
      peakStates: arena.peakInUse,
      leakedStates: arena.inUse,
    };
  }

  static searchLegacyCompact(state, options = {}) {
    if (state.currentPlayer.isRaiding || state.pendingTechCard) {
      throw new Error("LegacyCompact requires a stable, fully resolved search state");
    }
    const playerIndex = state.currentPlayerIndex;
    const evaluate = options.evaluate ?? ((candidate) =>
      evaluateLegacyParityState(candidate, playerIndex));
    const now = options.now ?? (() => performance.now());
    const deadline = now() + (options.timeBudgetMs ?? 20);
    const maxNodes = options.maxNodes ?? 12_800;
    const maxDepth = options.maxDepth ?? 100;
    const maxChildren = options.maxChildren ?? 800;
    const arena = new GameStateArena();
    const seen = options.exactTranspositions ? new PositionSet() : new CompactPositionSet();
    seen.add(exhaustivePositionKey(state));
    const rootScore = evaluate(state);
    let frontier = [{
      snapshot: createSearchSnapshot(state),
      firstMove: null,
      rootMoveKey: null,
    }];
    let bestByRoot = new Map();
    let completedBestByRoot = new Map();
    let expandedNodes = 0;
    let completedDepth = 0;
    let timedOut = false;
    let peakSnapshots = frontier.length;

    for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
      const next = [];
      let completedLayer = true;
      for (const node of frontier) {
        if (expandedNodes >= maxNodes || now() >= deadline) {
          completedLayer = false;
          timedOut = true;
          break;
        }
        const parent = arena.acquireSnapshot(node.snapshot);
        const children = this.orbitalMoves(parent, {
          maxChildren: Math.min(maxChildren, maxNodes - expandedNodes),
          shouldContinue: () => expandedNodes < maxNodes && now() < deadline,
          includeColonyMoves: true,
          includeRaidArtifactMoves: true,
          includeTechPowerMoves: true,
          includeTechDiscardMoves: true,
          legacyParity: true,
          cloneState: (source) => arena.acquire(source),
          releaseState: (released) => arena.release(released),
        });
        let childIndex = 0;
        for (const child of children) {
          if (expandedNodes >= maxNodes || now() >= deadline) {
            arena.release(child.state);
            completedLayer = false;
            timedOut = true;
            continue;
          }
          expandedNodes += 1;
          const positionKey = child.positionKey ?? exhaustivePositionKey(child.state);
          if (!seen.add(positionKey)) {
            arena.release(child.state);
            continue;
          }
          const firstMove = node.firstMove ?? child.move;
          const rootMoveKey = node.rootMoveKey ?? childIndex;
          childIndex += 1;
          const score = evaluate(child.state);
          const currentBest = bestByRoot.get(rootMoveKey);
          if (!currentBest || score > currentBest.score) {
            bestByRoot.set(rootMoveKey, { score, firstMove });
          }
          next.push({
            snapshot: createSearchSnapshot(child.state),
            firstMove,
            rootMoveKey,
          });
          arena.release(child.state);
        }
        arena.release(parent);
      }
      if (completedLayer) {
        completedDepth = depth;
        completedBestByRoot = new Map(bestByRoot);
      } else {
        break;
      }
      frontier = next;
      peakSnapshots = Math.max(peakSnapshots, frontier.length);
    }

    const candidates = completedBestByRoot.size > 0 ? completedBestByRoot : bestByRoot;
    const bestMove = [...candidates.values()]
      .sort((left, right) => right.score - left.score)[0] ?? null;
    const acceptedMove = bestMove?.score > rootScore ? bestMove : null;
    return {
      move: acceptedMove?.firstMove ?? null,
      principalVariation: acceptedMove ? [acceptedMove.firstMove] : [],
      score: acceptedMove?.score ?? rootScore,
      expandedNodes,
      uniqueStates: seen.size,
      completedDepth,
      timedOut,
      fallbackRequired: acceptedMove === null,
      createdStates: arena.created,
      peakStates: arena.peakInUse,
      peakSnapshots,
      leakedStates: arena.inUse,
    };
  }

  static searchLegacyFairProbe(state, options = {}) {
    const playerIndex = state.currentPlayerIndex;
    const evaluate = options.evaluate ?? ((candidate) =>
      evaluateLegacyParityState(candidate, playerIndex));
    const now = options.now ?? (() => performance.now());
    const deadline = now() + (options.timeBudgetMs ?? 20);
    const maxNodes = options.maxNodes ?? 12_800;
    const maxDepth = options.maxDepth ?? 100;
    const maxChildren = options.maxChildren ?? 800;
    const probeBeamWidth = options.probeBeamWidth ?? 8;
    const arena = new GameStateArena();
    const seen = new CompactPositionSet();
    seen.add(exhaustivePositionKey(state));
    const rootScore = evaluate(state);
    const rootChildren = this.orbitalMoves(state, {
      maxChildren: Math.min(maxChildren, maxNodes),
      shouldContinue: () => now() < deadline,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
      includeTechPowerMoves: true,
      includeTechDiscardMoves: true,
      legacyParity: true,
      cloneState: (source) => arena.acquire(source),
      releaseState: (released) => arena.release(released),
    });
    const roots = [];
    let expandedNodes = 0;
    for (let rootIndex = 0; rootIndex < rootChildren.length; rootIndex += 1) {
      const child = rootChildren[rootIndex];
      expandedNodes += 1;
      const key = child.positionKey ?? exhaustivePositionKey(child.state);
      if (!seen.add(key)) {
        arena.release(child.state);
        continue;
      }
      roots.push({
        rootIndex,
        firstMove: child.move,
        snapshot: createSearchSnapshot(child.state),
        score: evaluate(child.state),
        depth: 1,
      });
      arena.release(child.state);
    }
    const remainingBudget = Math.max(0, maxNodes - expandedNodes);
    const budgetPerRoot = roots.length > 0 ? Math.floor(remainingBudget / roots.length) : 0;
    let completedDepth = roots.length > 0 ? 1 : 0;
    let timedOut = false;

    for (const root of roots) {
      let frontier = [root];
      let usedByRoot = 0;
      for (let depth = 2;
        depth <= maxDepth && frontier.length > 0 && usedByRoot < budgetPerRoot;
        depth += 1) {
        const next = [];
        for (const node of frontier) {
          if (usedByRoot >= budgetPerRoot || now() >= deadline) {
            timedOut = now() >= deadline;
            break;
          }
          const parent = arena.acquireSnapshot(node.snapshot);
          const children = this.orbitalMoves(parent, {
            maxChildren: Math.min(maxChildren, budgetPerRoot - usedByRoot),
            shouldContinue: () => usedByRoot < budgetPerRoot && now() < deadline,
            includeColonyMoves: true,
            includeRaidArtifactMoves: true,
            includeTechPowerMoves: true,
            includeTechDiscardMoves: true,
            legacyParity: true,
            cloneState: (source) => arena.acquire(source),
            releaseState: (released) => arena.release(released),
          });
          for (const child of children) {
            if (usedByRoot >= budgetPerRoot || now() >= deadline) {
              arena.release(child.state);
              timedOut = now() >= deadline;
              continue;
            }
            usedByRoot += 1;
            expandedNodes += 1;
            const key = child.positionKey ?? exhaustivePositionKey(child.state);
            if (!seen.add(key)) {
              arena.release(child.state);
              continue;
            }
            const score = evaluate(child.state);
            if (score > root.score) {
              root.score = score;
              root.depth = depth;
            }
            next.push({
              snapshot: createSearchSnapshot(child.state),
              score,
              depth,
            });
            arena.release(child.state);
          }
          arena.release(parent);
        }
        frontier = next
          .sort((left, right) => right.score - left.score)
          .slice(0, probeBeamWidth);
        completedDepth = Math.max(completedDepth, depth);
        if (timedOut) {
          break;
        }
      }
      if (timedOut) {
        break;
      }
    }

    const bestMove = roots.sort((left, right) => right.score - left.score)[0] ?? null;
    const acceptedMove = bestMove?.score > rootScore ? bestMove : null;
    return {
      move: acceptedMove?.firstMove ?? null,
      principalVariation: acceptedMove ? [acceptedMove.firstMove] : [],
      score: acceptedMove?.score ?? rootScore,
      expandedNodes,
      uniqueStates: seen.size,
      completedDepth,
      timedOut,
      fallbackRequired: acceptedMove === null,
      rootActions: roots.length,
      budgetPerRoot,
      selectedProbeDepth: acceptedMove?.depth ?? 0,
      createdStates: arena.created,
      peakStates: arena.peakInUse,
      leakedStates: arena.inUse,
    };
  }
}
