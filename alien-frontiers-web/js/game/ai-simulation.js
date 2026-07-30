import { AIType } from "./constants.js";
import { ExhaustiveAI } from "./exhaustive-ai.js";
import { GameState } from "./game-state.js";
import { SimpleAI } from "./simple-ai.js";

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
      return { moved: SimpleAI.step(state), searched: false, fallback: false, nodes: 0 };
    },
  };
}

export function exhaustiveStrategy(name, options = {}) {
  const searchedTurns = new WeakMap();
  const searchOptions = {
    maxNodes: options.maxNodes ?? 100,
    maxDepth: options.maxDepth ?? 4,
    beamWidth: options.beamWidth ?? 16,
    maxChildren: options.maxChildren ?? 96,
  };
  return {
    name,
    searchOptions,
    decide(state) {
      const player = state.currentPlayer;
      const turnKey = `${state.numTurns}:${state.currentPlayerIndex}`;
      const shipsByValue = new Map();
      for (const ship of player.undockedShips) {
        const ships = shipsByValue.get(ship.value) ?? [];
        ships.push(ship);
        shipsByValue.set(ship.value, ships);
      }
      const needsUnsupportedPlanner = state.canPurchaseArtifactShip(player)
        || [...shipsByValue.values()].some((ships) =>
          ships.length >= 3
          && state.colonyConstructor.isValidMoveFromPlayer(player, ships.slice(0, 3)))
        || player.undockedShips.some((ship) =>
          state.terraformingStation.isValidMoveFromPlayer(player, [ship]))
        || player.undockedShips.some((first, firstIndex) =>
          player.undockedShips.some((second, secondIndex) =>
            secondIndex > firstIndex
            && player.undockedShips.some((third, thirdIndex) =>
              thirdIndex > secondIndex
              && state.raidersOutpost.isValidMoveFromPlayer(player, [first, second, third]))));
      const searchable = player.initialRollDone
        && !player.isRaiding
        && player.coloniesToLaunch === 0
        && !state.pendingTechCard
        && player.numUndockedShips > 0
        && !needsUnsupportedPlanner
        && searchedTurns.get(state) !== turnKey;
      if (!searchable) {
        return { moved: SimpleAI.step(state), searched: false, fallback: false, nodes: 0 };
      }
      const result = ExhaustiveAI.search(state, {
        generateChildren: (candidate, search) => ExhaustiveAI.orbitalMoves(candidate, {
          maxChildren: Math.min(searchOptions.maxChildren, search.remainingNodes),
          shouldContinue: search.shouldContinue,
        }),
        evaluate: options.evaluate,
        random: state.random,
        timeBudgetMs: Number.POSITIVE_INFINITY,
        maxNodes: searchOptions.maxNodes,
        maxDepth: searchOptions.maxDepth,
        beamWidth: searchOptions.beamWidth,
        now: () => 0,
      });
      const moved = ExhaustiveAI.executeMove(state, result.move);
      if (moved) {
        searchedTurns.set(state, turnKey);
        return {
          moved: true,
          searched: true,
          fallback: false,
          nodes: result.expandedNodes,
          uniqueStates: result.uniqueStates,
        };
      }
      return {
        moved: SimpleAI.step(state),
        searched: true,
        fallback: true,
        nodes: result.expandedNodes,
        uniqueStates: result.uniqueStates,
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
    ?? strategies.map((_strategy, index) => [AIType.hard, AIType.pirate, AIType.medium, AIType.easy][index]);
  const state = new GameState(strategies.length, personalities, random, random);
  const metrics = strategies.map(() => ({
    decisions: 0,
    searchedDecisions: 0,
    fallbackDecisions: 0,
    nodes: 0,
    elapsedMs: 0,
  }));
  let steps = 0;
  while (!state.gameOver && steps < maxSteps) {
    const playerIndex = state.currentPlayerIndex;
    const started = performance.now();
    const result = strategies[playerIndex].decide(state);
    const elapsedMs = performance.now() - started;
    const playerMetrics = metrics[playerIndex];
    playerMetrics.decisions += 1;
    playerMetrics.searchedDecisions += result.searched ? 1 : 0;
    playerMetrics.fallbackDecisions += result.fallback ? 1 : 0;
    playerMetrics.nodes += result.nodes ?? 0;
    playerMetrics.elapsedMs += elapsedMs;
    steps += 1;
    if (!result.moved) {
      throw new Error(`AI strategy ${strategies[playerIndex].name} made no move at step ${steps}`);
    }
  }
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
    players: state.players.map((player, playerIndex) => ({
      playerIndex,
      strategy: strategies[playerIndex].name,
      score: player.score,
      victoryPoints: player.vps,
      cards: player.cards.length,
      ore: player.ore,
      fuel: player.fuel,
      ...metrics[playerIndex],
    })),
  };
}

export function runTournament(options) {
  const entrants = options.entrants;
  const games = options.games ?? 100;
  const playersPerGame = options.playersPerGame ?? Math.min(4, entrants.length);
  const seed = options.seed ?? 1;
  if (playersPerGame < 2 || playersPerGame > 4) {
    throw new RangeError("Tournament games require two to four players");
  }
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
  }]));
  const results = [];
  for (let gameIndex = 0; gameIndex < games; gameIndex += 1) {
    const strategies = Array.from(
      { length: playersPerGame },
      (_unused, seat) => entrants[(gameIndex + seat) % entrants.length],
    );
    const result = simulateGame({
      strategies,
      seed: seed + gameIndex,
      maxSteps: options.maxSteps,
    });
    results.push(result);
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
