#!/usr/bin/env node

import { exhaustiveStrategy, runTournament, simpleStrategy } from "../alien-frontiers-web/js/game/ai-simulation.js";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const games = Number.parseInt(argument("games", "100"), 10);
const seed = Number.parseInt(argument("seed", "1"), 10);
const players = Number.parseInt(argument("players", "4"), 10);
const json = process.argv.includes("--json");
if (!Number.isInteger(games) || games <= 0) {
  throw new RangeError("--games must be a positive integer");
}
if (!Number.isInteger(seed)) {
  throw new RangeError("--seed must be an integer");
}

const entrants = [
  simpleStrategy("simple"),
  exhaustiveStrategy("search-25", { maxNodes: 25, maxDepth: 3, beamWidth: 8 }),
  exhaustiveStrategy("search-100", { maxNodes: 100, maxDepth: 5, beamWidth: 20 }),
  exhaustiveStrategy("search-400", { maxNodes: 400, maxDepth: 8, beamWidth: 48 }),
];
const tournament = runTournament({
  entrants,
  games,
  seed,
  playersPerGame: players,
});

if (json) {
  process.stdout.write(`${JSON.stringify(tournament, null, 2)}\n`);
} else {
  console.log(`Alien Frontiers AI tournament: ${games} games, seed ${seed}, ${players} players`);
  console.table(tournament.standings.map((standing) => ({
    strategy: standing.strategy,
    games: standing.games,
    wins: standing.wins,
    winRate: `${(standing.winRate * 100).toFixed(1)}%`,
    avgVP: standing.averageVictoryPoints.toFixed(2),
    avgDecisionMs: standing.averageDecisionMs.toFixed(3),
    avgNodes: standing.averageNodesPerSearch.toFixed(1),
    fallbackRate: `${(standing.fallbackRate * 100).toFixed(1)}%`,
    dnfRate: `${(standing.didNotFinishRate * 100).toFixed(1)}%`,
  })));
}
