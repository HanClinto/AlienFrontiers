import { AIType } from "./constants.js";
import { createGameSnapshot, restoreGameSnapshot } from "./game-persistence.js";
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
});

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

function playerValue(state, player) {
  const turnsLeft = estimatedTurnsLeft(state);
  const startingColonies = 10 - state.numPlayers;
  const terraformedShip = state.terraformingStation.docks[0]?.dockedShip;
  const countedShips = player.activeShips.length
    - (terraformedShip?.player === player ? 1 : 0);
  let value = 0;
  value += 0.3 * (6 - 18 / (player.fuel + 3));
  value += 0.9 * (6 - 18 / (player.ore + 3));
  value += countedShips * (11 + 0.25 * turnsLeft);
  value += player.cards.length * (-0.25 + 0.1 * turnsLeft);
  value += 12 * (startingColonies - player.coloniesLeft + player.coloniesToLaunch);
  value += player.vps;
  value += state.colonistHub.colonyPosition(player.playerIndex);
  for (const card of player.cards) {
    value += TECH_VALUES[card.type] ?? 0;
  }
  if (player.cards.some((card) => [
    TechCardType.boosterPod,
    TechCardType.stasisBeam,
    TechCardType.polarityDevice,
  ].includes(card.type))) {
    value += 1;
  }
  if (player.activeShips.some((ship) => ship.isArtifactShip)) {
    value -= 4;
  }
  return value;
}

export function evaluateExhaustiveState(state, playerIndex, random = () => 0.5) {
  const player = state.players[playerIndex];
  const profile = PERSONALITIES[player.aiType] ?? PERSONALITIES[AIType.easy];
  if (state.gameOver) {
    return state.winningPlayers[0] === player ? 1_000_000 : -1_000_000;
  }
  const myValue = playerValue(state, player);
  const opponentValue = Math.max(...state.players
    .filter((candidate) => candidate !== player)
    .map((candidate) => playerValue(state, candidate)
      * (candidate.aiType === AIType.human ? profile.humanPrejudice : 1)));
  const randomInfluence = (random() * 2 - 1) * profile.randomRange;
  const unfinishedPenalty = player.numUndockedShips > 0 ? 10_000 : 0;
  return myValue - opponentValue * profile.aggression + randomInfluence - unfinishedPenalty;
}

export class ExhaustiveAI {
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
          timeBudgetMs: searchOptions.timeBudgetMs,
          maxNodes: searchOptions.maxNodes,
          maxDepth: searchOptions.maxDepth,
          beamWidth: searchOptions.beamWidth,
          maxChildren: searchOptions.maxChildren,
        },
      });
    });
  }

  static orbitalMoves(state, options = {}) {
    const maxChildren = options.maxChildren ?? 96;
    const shouldContinue = options.shouldContinue ?? (() => true);
    const player = state.currentPlayer;
    if (
      !player.initialRollDone
      || player.isRaiding
      || player.coloniesToLaunch > 0
      || state.pendingTechCard
      || player.numUndockedShips === 0
    ) {
      return [];
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
    const ships = player.undockedShips;
    const children = [];
    const childKeys = new Set();
    for (const orbitalName of orbitalNames) {
      const orbital = state[orbitalName];
      const subsetCount = 2 ** ships.length;
      for (let mask = 1; mask < subsetCount; mask += 1) {
        if (!shouldContinue()) {
          return children;
        }
        const selectedShips = ships.filter((_ship, index) => mask & (1 << index));
        if (!state.canCommitShipsTo(orbital, selectedShips)) {
          continue;
        }
        const childState = restoreGameSnapshot(createGameSnapshot(state));
        const childShips = selectedShips.map((ship) =>
          childState.currentPlayer.activeShips.find((candidate) =>
            candidate.shipIndex === ship.shipIndex));
        if (!childState[orbitalName].commitShipsFromPlayer(childState.currentPlayer, childShips)) {
          continue;
        }
        const childKey = exhaustiveStateKey(childState);
        if (childKeys.has(childKey)) {
          continue;
        }
        childKeys.add(childKey);
        children.push({
          state: childState,
          move: { orbitalName, shipIndexes: selectedShips.map((ship) => ship.shipIndex) },
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
    const ships = move.shipIndexes.map((shipIndex) =>
      state.currentPlayer.activeShips.find((ship) => ship.shipIndex === shipIndex));
    return ships.every(Boolean)
      && state[move.orbitalName]?.commitShipsFromPlayer(state.currentPlayer, ships) === true;
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
    const seen = new Set([exhaustiveStateKey(state)]);
    const rootScore = evaluate(state);
    let frontier = [{ state, moves: [], score: rootScore }];
    let bestMove = null;
    let expandedNodes = 0;
    let timedOut = false;

    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
      const next = [];
      for (const node of frontier) {
        if (expandedNodes >= maxNodes || now() >= deadline) {
          timedOut = true;
          break;
        }
        const searchContext = {
          shouldContinue: () => expandedNodes < maxNodes && now() < deadline,
          remainingNodes: maxNodes - expandedNodes,
        };
        for (const child of generateChildren(node.state, searchContext)) {
          if (expandedNodes >= maxNodes) {
            timedOut = true;
            break;
          }
          expandedNodes += 1;
          const key = exhaustiveStateKey(child.state);
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
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
}
