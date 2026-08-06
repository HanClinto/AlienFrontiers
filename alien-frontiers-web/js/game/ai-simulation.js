import { AIType } from "./constants.js";
import { ExhaustiveAI, evaluateLegacyParityState, exhaustivePositionKey, exhaustivePositionKeysEqual } from "./exhaustive-ai.js";
import { EventName } from "./constants.js";
import { GameState } from "./game-state.js";
import { SimpleAI } from "./simple-ai.js";

function incrementCount(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function sortedTechTypes(cards) {
  return cards.map((card) => card.type).sort();
}

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function simpleStrategy(name = "simple") {
  return {
    name,
    decide(state) {
      return {
        moved: SimpleAI.step(state),
        searched: false,
        fallback: false,
        nodes: 0,
        moveType: "simple",
      };
    },
  };
}

export function exhaustiveStrategy(name, options = {}) {
  const searchedTurns = new WeakMap();
  const searchedPositions = new WeakMap();
  const searchOptions = {
    maxNodes: options.maxNodes ?? 100,
    maxDepth: options.maxDepth ?? 4,
    beamWidth: options.beamWidth ?? 16,
    maxChildren: options.maxChildren ?? 96,
    includeColonyMoves: options.includeColonyMoves ?? true,
    includeRaidArtifactMoves: options.includeRaidArtifactMoves ?? false,
    includeTechPowerMoves: options.includeTechPowerMoves ?? false,
    includeTechDiscardMoves: options.includeTechDiscardMoves ?? false,
    maxTechDiscardMovesPerType: options.maxTechDiscardMovesPerType
      ?? Number.POSITIVE_INFINITY,
    maxRaidOutcomes: options.maxRaidOutcomes ?? Number.POSITIVE_INFINITY,
    repeatSearchWithinTurn: options.repeatSearchWithinTurn ?? false,
    distributeChildrenAcrossFrontier: options.distributeChildrenAcrossFrontier ?? false,
  };
  return {
    name,
    searchOptions,
    decide(state) {
      const player = state.currentPlayer;
      const turnKey = `${state.numTurns}:${state.currentPlayerIndex}`;
      const positionKey = searchOptions.repeatSearchWithinTurn
        ? exhaustivePositionKey(state)
        : null;
      const alreadySearched = searchOptions.repeatSearchWithinTurn
        ? searchedPositions.has(state)
          && exhaustivePositionKeysEqual(searchedPositions.get(state), positionKey)
        : searchedTurns.get(state) === turnKey;
      const shipsByValue = new Map();
      for (const ship of player.undockedShips) {
        const ships = shipsByValue.get(ship.value) ?? [];
        ships.push(ship);
        shipsByValue.set(ship.value, ships);
      }
      const needsUnsupportedPlanner = (!searchOptions.includeRaidArtifactMoves && (
        state.canPurchaseArtifactShip(player)
        || player.artifactCreditAvailable >= 8
      ))
        || (!searchOptions.includeColonyMoves && (
          player.coloniesToLaunch > 0
          || [...shipsByValue.values()].some((ships) =>
            ships.length >= 3
            && state.colonyConstructor.isValidMoveFromPlayer(player, ships.slice(0, 3)))
          || player.undockedShips.some((ship) =>
            state.terraformingStation.isValidMoveFromPlayer(player, [ship]))
          || state.colonistHub.ableToLaunch(player)
        ))
        || (!searchOptions.includeRaidArtifactMoves && player.undockedShips.some((first, firstIndex) =>
          player.undockedShips.some((second, secondIndex) =>
            secondIndex > firstIndex
            && player.undockedShips.some((third, thirdIndex) =>
              thirdIndex > secondIndex
              && state.raidersOutpost.isValidMoveFromPlayer(player, [first, second, third])))));
      const searchable = player.initialRollDone
        && !player.isRaiding
        && !state.pendingTechCard
        && (player.numUndockedShips > 0
          || (searchOptions.includeColonyMoves && player.coloniesToLaunch > 0))
        && !needsUnsupportedPlanner
        && !alreadySearched;
      if (!searchable) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const result = ExhaustiveAI.search(state, {
        generateChildren: (candidate, search) => ExhaustiveAI.orbitalMoves(candidate, {
          maxChildren: Math.min(searchOptions.maxChildren, search.remainingNodes),
          shouldContinue: search.shouldContinue,
          includeColonyMoves: searchOptions.includeColonyMoves,
          includeRaidArtifactMoves: searchOptions.includeRaidArtifactMoves,
          includeTechPowerMoves: searchOptions.includeTechPowerMoves,
          includeTechDiscardMoves: searchOptions.includeTechDiscardMoves,
          maxTechDiscardMovesPerType: searchOptions.maxTechDiscardMovesPerType,
          maxRaidOutcomes: searchOptions.maxRaidOutcomes,
        }),
        evaluate: options.evaluate,
        timeBudgetMs: Number.POSITIVE_INFINITY,
        maxNodes: searchOptions.maxNodes,
        maxDepth: searchOptions.maxDepth,
        beamWidth: searchOptions.beamWidth,
        distributeChildrenAcrossFrontier: searchOptions.distributeChildrenAcrossFrontier,
        now: () => 0,
      });
      const moved = ExhaustiveAI.executeMove(state, result.move);
      if (moved) {
        if (searchOptions.repeatSearchWithinTurn) {
          searchedPositions.set(state, positionKey);
        } else {
          searchedTurns.set(state, turnKey);
        }
        return {
          moved: true,
          searched: true,
          fallback: false,
          nodes: result.expandedNodes,
          uniqueStates: result.uniqueStates,
          moveType: result.move?.type ?? "orbital",
        };
      }
      return {
        moved: SimpleAI.step(state),
        searched: true,
        fallback: true,
        nodes: result.expandedNodes,
        uniqueStates: result.uniqueStates,
        moveType: "fallback",
      };
    },
  };
}

export function legacyParityStrategy(name = "LegacyParity-400", options = {}) {
  const searchedPositions = new WeakMap();
  const searchOptions = {
    maxNodes: options.maxNodes ?? 400,
    maxDepth: options.maxDepth ?? 100,
    maxChildren: options.maxChildren ?? 800,
  };
  return {
    name,
    searchOptions,
    decide(state) {
      const player = state.currentPlayer;
      if (!player.initialRollDone || player.isRaiding || state.pendingTechCard) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const positionKey = exhaustivePositionKey(state);
      if (
        searchedPositions.has(state)
        && exhaustivePositionKeysEqual(searchedPositions.get(state), positionKey)
      ) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const result = ExhaustiveAI.searchLegacyParity(state, {
        generateChildren: (candidate, search) => ExhaustiveAI.orbitalMoves(candidate, {
          maxChildren: Math.min(searchOptions.maxChildren, search.remainingNodes),
          shouldContinue: search.shouldContinue,
          includeColonyMoves: true,
          includeRaidArtifactMoves: true,
          includeTechPowerMoves: true,
          includeTechDiscardMoves: true,
          legacyParity: true,
        }),
        timeBudgetMs: Number.POSITIVE_INFINITY,
        maxNodes: searchOptions.maxNodes,
        maxDepth: searchOptions.maxDepth,
        evaluate: (candidate) => evaluateLegacyParityState(
          candidate,
          state.currentPlayerIndex,
        ),
        now: () => 0,
      });
      const moved = ExhaustiveAI.executeMove(state, result.move);
      if (moved) {
        searchedPositions.set(state, positionKey);
        return {
          moved: true,
          searched: true,
          fallback: false,
          nodes: result.expandedNodes,
          uniqueStates: result.uniqueStates,
          moveType: result.move?.type ?? "orbital",
        };
      }
      let finished = false;
      if (player.numUndockedShips > 0) {
        finished = state.maintenanceBay.commitShipsFromPlayer(player, player.undockedShips);
      } else if (state.canEndTurn) {
        finished = state.gotoNextPlayer();
      }
      if (finished) {
        return {
          moved: true,
          searched: true,
          fallback: false,
          nodes: result.expandedNodes,
          uniqueStates: result.uniqueStates,
          moveType: "legacy-finish",
        };
      }
      return {
        moved: SimpleAI.step(state),
        searched: true,
        fallback: true,
        nodes: result.expandedNodes,
        uniqueStates: result.uniqueStates,
        moveType: "fallback",
      };
    },
  };
}

export function legacyProbeStrategy(name = "LegacyProbe-48", options = {}) {
  const searchedPositions = new WeakMap();
  const searchOptions = {
    maxNodes: options.maxNodes ?? 12_800,
    maxDepth: options.maxDepth ?? 100,
    beamWidth: options.beamWidth ?? 48,
    maxChildren: options.maxChildren ?? 800,
  };
  return {
    name,
    searchOptions,
    decide(state) {
      const player = state.currentPlayer;
      if (!player.initialRollDone || player.isRaiding || state.pendingTechCard) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const positionKey = exhaustivePositionKey(state);
      if (
        searchedPositions.has(state)
        && exhaustivePositionKeysEqual(searchedPositions.get(state), positionKey)
      ) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const result = ExhaustiveAI.searchLegacyProbe(state, {
        maxNodes: searchOptions.maxNodes,
        maxDepth: searchOptions.maxDepth,
        beamWidth: searchOptions.beamWidth,
        maxChildren: searchOptions.maxChildren,
        now: () => 0,
        timeBudgetMs: Number.POSITIVE_INFINITY,
      });
      const moved = ExhaustiveAI.executeMove(state, result.move);
      if (moved) {
        searchedPositions.set(state, positionKey);
        return {
          moved: true,
          searched: true,
          fallback: false,
          nodes: result.expandedNodes,
          uniqueStates: result.uniqueStates,
          moveType: result.move?.type ?? "orbital",
        };
      }
      let finished = false;
      if (player.numUndockedShips > 0) {
        finished = state.maintenanceBay.commitShipsFromPlayer(player, player.undockedShips);
      } else if (state.canEndTurn) {
        finished = state.gotoNextPlayer();
      }
      return {
        moved: finished || SimpleAI.step(state),
        searched: true,
        fallback: !finished,
        nodes: result.expandedNodes,
        uniqueStates: result.uniqueStates,
        moveType: finished ? "legacy-finish" : "fallback",
      };
    },
  };
}

export function legacyCompactStrategy(name = "LegacyCompact-12800", options = {}) {
  const searchedPositions = new WeakMap();
  const searchOptions = {
    maxNodes: options.maxNodes ?? 12_800,
    maxDepth: options.maxDepth ?? 100,
    maxChildren: options.maxChildren ?? 800,
  };
  return {
    name,
    searchOptions,
    decide(state) {
      const player = state.currentPlayer;
      if (!player.initialRollDone || player.isRaiding || state.pendingTechCard) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const positionKey = exhaustivePositionKey(state);
      if (
        searchedPositions.has(state)
        && exhaustivePositionKeysEqual(searchedPositions.get(state), positionKey)
      ) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const result = ExhaustiveAI.searchLegacyCompact(state, {
        maxNodes: searchOptions.maxNodes,
        maxDepth: searchOptions.maxDepth,
        maxChildren: searchOptions.maxChildren,
        now: () => 0,
        timeBudgetMs: Number.POSITIVE_INFINITY,
      });
      const moved = ExhaustiveAI.executeMove(state, result.move);
      if (moved) {
        searchedPositions.set(state, positionKey);
        return {
          moved: true,
          searched: true,
          fallback: false,
          nodes: result.expandedNodes,
          uniqueStates: result.uniqueStates,
          moveType: result.move?.type ?? "orbital",
        };
      }
      let finished = false;
      if (player.numUndockedShips > 0) {
        finished = state.maintenanceBay.commitShipsFromPlayer(player, player.undockedShips);
      } else if (state.canEndTurn) {
        finished = state.gotoNextPlayer();
      }
      return {
        moved: finished || SimpleAI.step(state),
        searched: true,
        fallback: !finished,
        nodes: result.expandedNodes,
        uniqueStates: result.uniqueStates,
        moveType: finished ? "legacy-finish" : "fallback",
      };
    },
  };
}

export function legacyFairProbeStrategy(name = "LegacyFairProbe-4", options = {}) {
  const searchedPositions = new WeakMap();
  const searchOptions = {
    maxNodes: options.maxNodes ?? 12_800,
    maxDepth: options.maxDepth ?? 100,
    maxChildren: options.maxChildren ?? 800,
    probeBeamWidth: options.probeBeamWidth ?? 4,
  };
  return {
    name,
    searchOptions,
    decide(state) {
      const player = state.currentPlayer;
      if (!player.initialRollDone || player.isRaiding || state.pendingTechCard) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const positionKey = exhaustivePositionKey(state);
      if (
        searchedPositions.has(state)
        && exhaustivePositionKeysEqual(searchedPositions.get(state), positionKey)
      ) {
        return {
          moved: SimpleAI.step(state),
          searched: false,
          fallback: false,
          nodes: 0,
          moveType: "simple",
        };
      }
      const result = ExhaustiveAI.searchLegacyFairProbe(state, {
        ...searchOptions,
        now: () => 0,
        timeBudgetMs: Number.POSITIVE_INFINITY,
      });
      const moved = ExhaustiveAI.executeMove(state, result.move);
      if (moved) {
        searchedPositions.set(state, positionKey);
        return {
          moved: true,
          searched: true,
          fallback: false,
          nodes: result.expandedNodes,
          uniqueStates: result.uniqueStates,
          moveType: result.move?.type ?? "orbital",
        };
      }
      let finished = false;
      if (player.numUndockedShips > 0) {
        finished = state.maintenanceBay.commitShipsFromPlayer(player, player.undockedShips);
      } else if (state.canEndTurn) {
        finished = state.gotoNextPlayer();
      }
      return {
        moved: finished || SimpleAI.step(state),
        searched: true,
        fallback: !finished,
        nodes: result.expandedNodes,
        uniqueStates: result.uniqueStates,
        moveType: finished ? "legacy-finish" : "fallback",
      };
    },
  };
}

export function simulateGame(options) {
  const strategies = options.strategies;
  const seed = options.seed ?? 1;
  const maxSteps = options.maxSteps ?? 10_000;
  const random = seededRandom(seed);
  const personalities = options.personalities
    ?? strategies.map((strategy, index) => strategy.personality
      ?? [AIType.hard, AIType.pirate, AIType.medium, AIType.easy][index]);
  const state = new GameState(strategies.length, personalities, random, random);
  let mutationCount = 0;
  const unsubscribers = [state.events.on(EventName.stateChanged, () => {
    mutationCount += 1;
  })];
  const startingTech = state.players.map((player) => player.cards[0]?.type ?? null);
  const everOwnedTech = state.players.map((player) => new Set(sortedTechTypes(player.cards)));
  const techPowerUses = state.players.map(() => ({}));
  const techDiscardUses = state.players.map(() => ({}));
  const refreshTechOwnership = () => {
    for (const player of state.players) {
      for (const card of player.cards) {
        everOwnedTech[player.playerIndex].add(card.type);
      }
    }
  };
  unsubscribers.push(state.events.on(EventName.techCardsChanged, refreshTechOwnership));
  unsubscribers.push(state.events.on(EventName.techUsed, ({ object }) => {
    const counts = object.mode === "discard"
      ? techDiscardUses[object.playerIndex]
      : techPowerUses[object.playerIndex];
    incrementCount(counts, object.cardType);
  }));
  let playerTurn = 0;
  const turnEstimateSamples = [];
  const recordTurnEstimate = () => {
    const coloniesLeft = state.players.map((player) => player.coloniesLeft);
    turnEstimateSamples.push({
      playerTurn,
      round: state.numTurns,
      currentSeat: state.currentPlayerIndex,
      estimatedRoundsRemaining: Math.min(...coloniesLeft),
      coloniesLeft,
      coloniesToLaunch: state.players.map((player) => player.coloniesToLaunch),
      activeShips: state.players.map((player) => player.activeNativeShips.length),
    });
  };
  recordTurnEstimate();
  unsubscribers.push(state.events.on(EventName.nextPlayer, () => {
    playerTurn += 1;
    recordTurnEstimate();
  }));
  const metrics = strategies.map(() => ({
    decisions: 0,
    searchedDecisions: 0,
    fallbackDecisions: 0,
    nodes: 0,
    elapsedMs: 0,
    moveTypes: {},
  }));
  let steps = 0;
  while (!state.gameOver && steps < maxSteps) {
    const playerIndex = state.currentPlayerIndex;
    const started = performance.now();
    const beforeMutationCount = mutationCount;
    const result = strategies[playerIndex].decide(state);
    const elapsedMs = performance.now() - started;
    const playerMetrics = metrics[playerIndex];
    playerMetrics.decisions += 1;
    playerMetrics.searchedDecisions += result.searched ? 1 : 0;
    playerMetrics.fallbackDecisions += result.fallback ? 1 : 0;
    playerMetrics.nodes += result.nodes ?? 0;
    playerMetrics.elapsedMs += elapsedMs;
    playerMetrics.moveTypes[result.moveType] = (playerMetrics.moveTypes[result.moveType] ?? 0) + 1;
    steps += 1;
    if (!result.moved) {
      throw new Error(`AI strategy ${strategies[playerIndex].name} made no move at step ${steps}`);
    }
    if (beforeMutationCount === mutationCount) {
      for (const unsubscribe of unsubscribers) unsubscribe();
      throw new Error(`AI strategy ${strategies[playerIndex].name} reported a no-progress move at step ${steps}`);
    }
  }
  for (const unsubscribe of unsubscribers) unsubscribe();
  const completed = state.gameOver;
  const ranking = state.winningPlayers;
  return {
    seed,
    completed,
    termination: completed ? "game-over" : "max-steps",
    steps,
    turns: state.numTurns,
    winnerIndex: completed ? ranking[0].playerIndex : null,
    ranking: ranking.map((player) => player.playerIndex),
    turnEstimateSamples: turnEstimateSamples.map((sample) => ({
      ...sample,
      actualPlayerTurnsRemaining: playerTurn - sample.playerTurn + 1,
      actualRoundsRemaining: (playerTurn - sample.playerTurn + 1) / state.numPlayers,
    })),
    players: state.players.map((player, playerIndex) => ({
      playerIndex,
      seat: playerIndex + 1,
      strategy: strategies[playerIndex].name,
      personality: player.aiType,
      score: player.score,
      victoryPoints: player.vps,
      cards: player.cards.length,
      startingTech: startingTech[playerIndex],
      everOwnedTech: [...everOwnedTech[playerIndex]].sort(),
      finalTech: sortedTechTypes(player.cards),
      techPowerUses: techPowerUses[playerIndex],
      techDiscardUses: techDiscardUses[playerIndex],
      regions: state.regions.map((region) => ({
        name: region.title,
        colonies: region.coloniesForPlayer(playerIndex),
        controlled: region.playerWithMajority === playerIndex,
        isolated: region.hasIsolationField,
      })),
      ore: player.ore,
      fuel: player.fuel,
      ...metrics[playerIndex],
      won: completed && playerIndex === ranking[0].playerIndex,
    })),
  };
}

export function summarizeTournamentResults(results, entrants, options = {}) {
  const games = results.length;
  const playersPerGame = options.playersPerGame ?? Math.min(4, entrants.length);
  const seed = options.seed ?? results[0]?.seed ?? 1;
  const totals = new Map(entrants.map((entrant) => [entrant.name, {
    strategy: entrant.name,
    games: 0,
    wins: 0,
    didNotFinish: 0,
    victoryPoints: 0,
    score: 0,
    decisions: 0,
    searchedDecisions: 0,
    fallbackDecisions: 0,
    nodes: 0,
    elapsedMs: 0,
    moveTypes: {},
  }]));
  for (const result of results) {
    for (const player of result.players) {
      const total = totals.get(player.strategy);
      total.games += 1;
      total.wins += result.completed && player.playerIndex === result.winnerIndex ? 1 : 0;
      total.didNotFinish += result.completed ? 0 : 1;
      total.victoryPoints += player.victoryPoints;
      total.score += player.score;
      total.decisions += player.decisions;
      total.searchedDecisions += player.searchedDecisions;
      total.fallbackDecisions += player.fallbackDecisions;
      total.nodes += player.nodes;
      total.elapsedMs += player.elapsedMs;
      for (const [moveType, count] of Object.entries(player.moveTypes ?? {})) {
        total.moveTypes[moveType] = (total.moveTypes[moveType] ?? 0) + count;
      }
    }
  }
  return {
    games,
    seed,
    playersPerGame,
    standings: [...totals.values()].map((total) => ({
      ...total,
      winRate: total.games ? total.wins / total.games : 0,
      averageVictoryPoints: total.games ? total.victoryPoints / total.games : 0,
      averageScore: total.games ? total.score / total.games : 0,
      averageDecisionMs: total.decisions ? total.elapsedMs / total.decisions : 0,
      averageNodesPerSearch: total.searchedDecisions ? total.nodes / total.searchedDecisions : 0,
      fallbackRate: total.searchedDecisions
        ? total.fallbackDecisions / total.searchedDecisions
        : 0,
      didNotFinishRate: total.games ? total.didNotFinish / total.games : 0,
    })).sort((left, right) => right.winRate - left.winRate),
    results,
  };
}

export function simulateTournamentGame(options) {
  const { entrants, gameIndex, seed, playersPerGame, maxSteps } = options;
  const strategies = Array.from(
    { length: playersPerGame },
    (_unused, seat) => entrants[(gameIndex + seat) % entrants.length],
  );
  return simulateGame({
    strategies,
    seed: seed + gameIndex,
    maxSteps,
  });
}

export function runTournament(options) {
  const entrants = options.entrants;
  const games = options.games ?? 100;
  const playersPerGame = options.playersPerGame ?? Math.min(4, entrants.length);
  const seed = options.seed ?? 1;
  if (playersPerGame < 2 || playersPerGame > 4) {
    throw new RangeError("Tournament games require two to four players");
  }
  const results = [];
  for (let gameIndex = 0; gameIndex < games; gameIndex += 1) {
    results.push(simulateTournamentGame({
      entrants,
      gameIndex,
      seed,
      playersPerGame,
      maxSteps: options.maxSteps,
    }));
  }
  return summarizeTournamentResults(results, entrants, { playersPerGame, seed });
}

export function runBalancedTournament(options) {
  const entrants = options.entrants;
  const blocks = options.blocks ?? 100;
  const playersPerGame = options.playersPerGame ?? Math.min(4, entrants.length);
  const seed = options.seed ?? 1;
  const results = [];
  for (let block = 0; block < blocks; block += 1) {
    for (let rotation = 0; rotation < entrants.length; rotation += 1) {
      const gameIndex = block * entrants.length + rotation;
      const rotatedEntrants = [
        ...entrants.slice(rotation),
        ...entrants.slice(0, rotation),
      ];
      results.push(simulateGame({
        strategies: rotatedEntrants.slice(0, playersPerGame),
        seed: seed + block,
        maxSteps: options.maxSteps,
      }));
      results[results.length - 1].block = block;
      results[results.length - 1].rotation = rotation;
      results[results.length - 1].gameIndex = gameIndex;
    }
  }
  return summarizeTournamentResults(results, entrants, {
    playersPerGame,
    seed,
  });
}
