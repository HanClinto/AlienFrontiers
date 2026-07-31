#!/usr/bin/env node

import { cpus } from "node:os";
import { Worker } from "node:worker_threads";

import { generationStrategies } from "../alien-frontiers-web/js/game/ai-generations.js";
import { addConfidenceIntervals } from "../alien-frontiers-web/js/game/ai-statistics.js";
import { summarizeTournamentResults } from "../alien-frontiers-web/js/game/ai-simulation.js";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const games = Number.parseInt(argument("games", "1000"), 10);
const seed = Number.parseInt(argument("seed", "1000"), 10);
const playersPerGame = Number.parseInt(argument("players", "4"), 10);
const maxWorkers = Number.parseInt(argument("workers", String(Math.max(1, cpus().length - 2))), 10);
const generationIds = argument(
  "generations",
  "pioneer,homesteader-25,homesteader-100,homesteader-400",
).split(",");
const outputPath = argument("output", "");
const workerCount = Math.max(1, Math.min(maxWorkers, games));
const assignments = Array.from({ length: workerCount }, () => []);
for (let gameIndex = 0; gameIndex < games; gameIndex += 1) {
  assignments[gameIndex % workerCount].push(gameIndex);
}
const started = performance.now();
const chunks = await Promise.all(assignments.map((gameIndexes) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL("./ai-tournament-worker.mjs", import.meta.url), {
    workerData: { generationIds, gameIndexes, seed, playersPerGame, maxSteps: 10_000 },
  });
  worker.once("message", resolve);
  worker.once("error", reject);
  worker.once("exit", (code) => {
    if (code !== 0) {
      reject(new Error(`Tournament worker exited with code ${code}`));
    }
  });
})));
const results = chunks.flat().sort((left, right) => left.gameIndex - right.gameIndex)
  .map(({ result }) => result);
const entrants = generationStrategies(generationIds);
const tournament = addConfidenceIntervals(summarizeTournamentResults(
  results,
  entrants,
  { playersPerGame, seed },
));
const runtimeMs = performance.now() - started;
if (outputPath) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(outputPath, `${JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    games,
    seed,
    playersPerGame,
    workerCount,
    generationIds,
    runtimeMs,
    standings: tournament.standings,
  }, null, 2)}\n`);
}
console.log(`Alien Frontiers parallel tournament: ${games} games, ${workerCount} workers, ${(runtimeMs / 1000).toFixed(2)}s`);
console.table(tournament.standings.map((standing) => ({
  strategy: standing.strategy,
  games: standing.games,
  wins: standing.wins,
  winRate: `${(standing.winRate * 100).toFixed(1)}%`,
  win95: `${(standing.winRate95.low * 100).toFixed(1)}-${(standing.winRate95.high * 100).toFixed(1)}%`,
  avgVP: standing.averageVictoryPoints.toFixed(2),
  avgDecisionMs: standing.averageDecisionMs.toFixed(3),
  avgNodes: standing.averageNodesPerSearch.toFixed(1),
  dnfRate: `${(standing.didNotFinishRate * 100).toFixed(1)}%`,
})));
