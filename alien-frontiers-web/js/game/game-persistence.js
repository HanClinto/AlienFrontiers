import { EventName } from "./constants.js";
import { GameState } from "./game-state.js";
import { REGION_DEFINITIONS } from "./region.js";

const SNAPSHOT_VERSION = 1;
const SAVE_ENVELOPE_VERSION = 2;
const STORAGE_KEY = "alien-frontiers:saved-game";
const ORBITAL_KEYS = [
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
];

function shipSnapshot(ship, orbitalNames) {
  return {
    shipIndex: ship.shipIndex,
    value: ship.value,
    rollIndex: ship.rollIndex,
    active: ship.active,
    isSelected: ship.isSelected,
    dock: ship.dock
      ? { orbital: orbitalNames.get(ship.dock.orbital), index: ship.dock.index }
      : null,
    teleportRestriction: ship.teleportRestriction
      ? orbitalNames.get(ship.teleportRestriction)
      : null,
  };
}

export function createGameSnapshot(state) {
  const orbitalNames = new Map(ORBITAL_KEYS.map((key) => [state[key], key]));
  return {
    version: SNAPSHOT_VERSION,
    numPlayers: state.numPlayers,
    currentPlayerIndex: state.currentPlayerIndex,
    numTurns: state.numTurns,
    gameOver: state.gameOver,
    gameLog: [...state.gameLog],
    players: state.players.map((player) => ({
      aiType: player.aiType,
      fuel: player.fuel,
      ore: player.ore,
      coloniesLeft: player.coloniesLeft,
      coloniesToLaunch: player.coloniesToLaunch,
      marketPrice: player.marketPrice,
      initialRollDone: player.initialRollDone,
      techsDiscarded: player.techsDiscarded,
      artifactCreditAvailable: player.artifactCreditAvailable,
      artifactShufflesAvailable: player.artifactShufflesAvailable,
      borrowingRegion: state.regions.indexOf(player.borrowingRegion),
      selectedCard: player.selectedCard?.cardID ?? null,
      cardIDs: player.cards.map((card) => card.cardID),
      activeShipIDs: player.activeNativeShips.map((ship) => ship.shipIndex),
      inactiveShipIDs: player.inactiveShips.map((ship) => ship.shipIndex),
      ships: player.allShips
        .filter((ship) => !ship.isArtifactShip)
        .map((ship) => shipSnapshot(ship, orbitalNames)),
    })),
    artifactShip: {
      ...shipSnapshot(state.artifactShip, orbitalNames),
      playerIndex: state.artifactShip.player?.playerIndex ?? null,
      activeShipIndex: state.artifactShip.player?.activeShips.indexOf(state.artifactShip) ?? -1,
      allShipIndex: state.artifactShip.player?.allShips.indexOf(state.artifactShip) ?? -1,
    },
    regions: REGION_DEFINITIONS.map(([propertyName]) => {
      const region = state[propertyName];
      return {
        colonyCounts: [...region.colonyCounts],
        hasPositronField: region.hasPositronField,
        hasRepulsorField: region.hasRepulsorField,
        hasIsolationField: region.hasIsolationField,
        bonusUsedThisTurn: region.bonusUsedThisTurn,
      };
    }),
    colonistHub: {
      colonyPositions: [...state.colonistHub.colonyPositions],
      advancementThisTurn: state.colonistHub.advancementThisTurn,
    },
    cards: state.allTech.map((card) => ({
      cardID: card.cardID,
      tapped: card.tapped,
      isSelected: card.isSelected,
    })),
    techDrawDeck: state.techDrawDeck.map((card) => card.cardID),
    techDiscardDeck: state.techDiscardDeck.map((card) => card.cardID),
    techDisplayDeck: state.techDisplayDeck.map((card) => card.cardID),
  };
}

function restoreShip(ship, snapshot, state, player) {
  ship.player = player;
  ship.state = state;
  ship.value = snapshot.value;
  ship.rollIndex = snapshot.rollIndex;
  ship.active = snapshot.active;
  ship.isSelected = snapshot.isSelected;
  ship.dock = null;
  ship.teleportRestriction = snapshot.teleportRestriction
    ? state[snapshot.teleportRestriction]
    : null;
}

export function restoreGameSnapshot(snapshot, random = Math.random, cardRandom = Math.random) {
  if (!snapshot || snapshot.version !== SNAPSHOT_VERSION) {
    throw new Error("Unsupported Alien Frontiers save version");
  }
  const state = new GameState(
    snapshot.numPlayers,
    snapshot.players.map((player) => player.aiType),
    random,
    cardRandom,
  );
  return restoreGameSnapshotInto(state, snapshot, random, cardRandom);
}

export function restoreGameSnapshotInto(
  state,
  snapshot,
  random = Math.random,
  cardRandom = Math.random,
) {
  if (!snapshot || snapshot.version !== SNAPSHOT_VERSION) {
    throw new Error("Unsupported Alien Frontiers save version");
  }
  if (state.numPlayers !== snapshot.numPlayers) {
    throw new Error("Cannot restore a snapshot into a state with a different player count");
  }
  state.random = random;
  state.cardRandom = cardRandom;
  const cardsByID = new Map(state.allTech.map((card) => [card.cardID, card]));

  for (const orbitalKey of ORBITAL_KEYS) {
    for (const dock of state[orbitalKey].docks) {
      dock.dockedShip = null;
    }
  }

  snapshot.regions.forEach((regionSnapshot, index) => {
    const region = state.regions[index];
    region.colonyCounts = [...regionSnapshot.colonyCounts];
    region.hasPositronField = regionSnapshot.hasPositronField;
    region.hasRepulsorField = regionSnapshot.hasRepulsorField;
    region.hasIsolationField = regionSnapshot.hasIsolationField;
    region.bonusUsedThisTurn = regionSnapshot.bonusUsedThisTurn;
  });
  state.colonistHub.colonyPositions = [...snapshot.colonistHub.colonyPositions];
  state.colonistHub.advancementThisTurn = snapshot.colonistHub.advancementThisTurn;

  for (const card of state.allTech) {
    card.owner = null;
    const cardSnapshot = snapshot.cards.find((savedCard) => savedCard.cardID === card.cardID);
    card.tapped = cardSnapshot?.tapped ?? false;
    card.isSelected = cardSnapshot?.isSelected ?? false;
  }

  snapshot.players.forEach((playerSnapshot, playerIndex) => {
    const player = state.players[playerIndex];
    player.aiType = playerSnapshot.aiType;
    player.fuel = playerSnapshot.fuel;
    player.ore = playerSnapshot.ore;
    player.coloniesLeft = playerSnapshot.coloniesLeft;
    player.coloniesToLaunch = playerSnapshot.coloniesToLaunch;
    player.marketPrice = playerSnapshot.marketPrice;
    player.initialRollDone = playerSnapshot.initialRollDone;
    player.techsDiscarded = playerSnapshot.techsDiscarded;
    player.artifactCreditAvailable = playerSnapshot.artifactCreditAvailable;
    player.artifactShufflesAvailable = playerSnapshot.artifactShufflesAvailable;
    player.isRaiding = false;
    player.oreToRaid = 0;
    player.fuelToRaid = 0;
    player.cardToRaid = null;
    player.borrowingRegion = playerSnapshot.borrowingRegion >= 0
      ? state.regions[playerSnapshot.borrowingRegion]
      : null;
    const nativeShips = new Map(
      player.allShips.filter((ship) => !ship.isArtifactShip).map((ship) => [ship.shipIndex, ship]),
    );
    for (const savedShip of playerSnapshot.ships) {
      restoreShip(nativeShips.get(savedShip.shipIndex), savedShip, state, player);
    }
    player.activeShips = playerSnapshot.activeShipIDs.map((shipID) => nativeShips.get(shipID));
    player.inactiveShips = playerSnapshot.inactiveShipIDs.map((shipID) => nativeShips.get(shipID));
    player.allShips = [...nativeShips.values()];
    player.cards = playerSnapshot.cardIDs.map((cardID) => cardsByID.get(cardID));
    for (const card of player.cards) {
      card.owner = player;
    }
    player.selectedCard = playerSnapshot.selectedCard === null
      ? null
      : cardsByID.get(playerSnapshot.selectedCard);
  });

  const artifactOwner = snapshot.artifactShip.playerIndex === null
    ? null
    : state.players[snapshot.artifactShip.playerIndex];
  restoreShip(state.artifactShip, snapshot.artifactShip, state, artifactOwner);
  if (artifactOwner && state.artifactShip.active) {
    const activeShipIndex = snapshot.artifactShip.activeShipIndex ?? artifactOwner.activeShips.length;
    const allShipIndex = snapshot.artifactShip.allShipIndex ?? artifactOwner.allShips.length;
    artifactOwner.activeShips.splice(activeShipIndex, 0, state.artifactShip);
    artifactOwner.allShips.splice(allShipIndex, 0, state.artifactShip);
  }

  const allShips = [
    ...state.players.flatMap((player) => player.allShips),
    ...(state.artifactShip.active ? [] : [state.artifactShip]),
  ];
  for (const ship of allShips) {
    const playerIndex = ship.player?.playerIndex ?? "";
    const savedShip = ship.isArtifactShip
      ? snapshot.artifactShip
      : snapshot.players[playerIndex].ships.find((candidate) => candidate.shipIndex === ship.shipIndex);
    if (savedShip?.dock) {
      const dock = state[savedShip.dock.orbital].docks[savedShip.dock.index];
      dock.dockedShip = ship;
      ship.dock = dock;
    }
  }

  state.techDrawDeck = snapshot.techDrawDeck.map((cardID) => cardsByID.get(cardID));
  state.techDiscardDeck = snapshot.techDiscardDeck.map((cardID) => cardsByID.get(cardID));
  state.techDisplayDeck = snapshot.techDisplayDeck.map((cardID) => cardsByID.get(cardID));
  state.currentPlayerIndex = snapshot.currentPlayerIndex;
  state.numTurns = snapshot.numTurns;
  state.gameLog = [...snapshot.gameLog];
  state.pendingTechCard = null;
  state.pendingTechTargets = [];
  state.pendingColonyTargets = [];
  state.pendingTechAction = null;
  state.gameOver = snapshot.gameOver ?? false;
  return state;
}

function createSaveEnvelope(state) {
  return {
    version: SAVE_ENVELOPE_VERSION,
    state: createGameSnapshot(state),
    history: {
      undoSnapshot: state.history?.undoSnapshot ?? null,
      redoSnapshot: state.history?.redoSnapshot ?? null,
    },
  };
}

function restoreSaveEnvelope(saved) {
  if (saved?.version !== SAVE_ENVELOPE_VERSION || !saved.state) {
    return restoreGameSnapshot(saved);
  }
  const state = restoreGameSnapshot(saved.state);
  state.savedHistory = {
    undoSnapshot: saved.history?.undoSnapshot ?? null,
    redoSnapshot: saved.history?.redoSnapshot ?? null,
  };
  return state;
}

export class GamePersistence {
  constructor(storage = typeof localStorage === "undefined" ? null : localStorage) {
    this.storage = storage;
    this.unsubscribe = null;
    this.pendingSave = false;
  }

  save(state) {
    if (!this.storage || state.gameOver || state.pendingTechCard || state.currentPlayer.isRaiding) {
      return false;
    }
    this.storage.setItem(STORAGE_KEY, JSON.stringify(createSaveEnvelope(state)));
    return true;
  }

  load() {
    const serialized = this.storage?.getItem(STORAGE_KEY);
    return serialized ? restoreSaveEnvelope(JSON.parse(serialized)) : null;
  }

  clear() {
    this.storage?.removeItem(STORAGE_KEY);
  }

  get hasSavedGame() {
    return this.storage?.getItem(STORAGE_KEY) !== null;
  }

  bindState(state) {
    this.unbindState();
    this.save(state);
    this.unsubscribe = state.events.on(EventName.stateChanged, () => {
      if (this.pendingSave) {
        return;
      }
      this.pendingSave = true;
      queueMicrotask(() => {
        this.pendingSave = false;
        if (state.gameOver) {
          this.clear();
        } else {
          this.save(state);
        }
      });
    });
  }

  unbindState() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
