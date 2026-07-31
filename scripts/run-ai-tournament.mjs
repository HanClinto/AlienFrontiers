#!/usr/bin/env node

import { addConfidenceIntervals } from "../alien-frontiers-web/js/game/ai-statistics.js";
import { generationStrategies } from "../alien-frontiers-web/js/game/ai-generations.js";
import { runTournament } from "../alien-frontiers-web/js/game/ai-simulation.js";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const games = Number.parseInt(argument("games", "100"), 10);
const seed = Number.parseInt(argument("seed", "1"), 10);
const players = Number.parseInt(argument("players", "4"), 10);
const json = process.argv.includes("--json");
const generationIds = argument(
  "generations",
  "pioneer,homesteader-25,homesteader-100,homesteader-400",
).split(",");
if (!Number.isInteger(games) || games <= 0) {
  throw new RangeError("--games must be a positive integer");
}
if (!Number.isInteger(seed)) {
  throw new RangeError("--seed must be an integer");
}

const entrants = generationStrategies(generationIds);
const tournament = addConfidenceIntervals(runTournament({
  entrants,
  games,
  seed,
  playersPerGame: players,
}));

if (json) {
  process.stdout.write(`${JSON.stringify(tournament, null, 2)}\n`);
} else {
  console.log(`Alien Frontiers AI tournament: ${games} games, seed ${seed}, ${players} players`);
  console.table(tournament.standings.map((standing) => ({
    strategy: standing.strategy,
    games: standing.games,
    wins: standing.wins,
    winRate: `${(standing.winRate * 100).toFixed(1)}%`,
    win95: `${(standing.winRate95.low * 100).toFixed(1)}-${(standing.winRate95.high * 100).toFixed(1)}%`,
    avgVP: standing.averageVictoryPoints.toFixed(2),
    avgDecisionMs: standing.averageDecisionMs.toFixed(3),
    avgNodes: standing.averageNodesPerSearch.toFixed(1),
    fallbackRate: `${(standing.fallbackRate * 100).toFixed(1)}%`,
    dnfRate: `${(standing.didNotFinishRate * 100).toFixed(1)}%`,
  })));
}
