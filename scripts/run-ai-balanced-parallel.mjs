#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { dirname } from "node:path";
import { Worker } from "node:worker_threads";

import { generationStrategies } from "../alien-frontiers-web/js/game/ai-generations.js";
import { addConfidenceIntervals, pairedBootstrapDifference, strategyBlockWinRates } from "../alien-frontiers-web/js/game/ai-statistics.js";
import { summarizeTournamentResults } from "../alien-frontiers-web/js/game/ai-simulation.js";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const blocks = Number.parseInt(argument("blocks", "250"), 10);
const seed = Number.parseInt(argument("seed", "1000"), 10);
const generationIds = argument(
  "generations",
  "pioneer,homesteader-25,homesteader-100,homesteader-400",
).split(",");
const outputPath = argument("output", null);
const comparisonNames = argument("compare", null)?.split(",") ?? null;
const entrants = generationStrategies(generationIds);
const playersPerGame = entrants.length;
const games = blocks * entrants.length;
const workerCount = Math.max(1, Math.min(
  Number.parseInt(argument("workers", String(Math.max(1, cpus().length - 2))), 10),
  games,
));
const tasks = [];
for (let block = 0; block < blocks; block += 1) {
  for (let rotation = 0; rotation < entrants.length; rotation += 1) {
    tasks.push({ block, rotation, gameIndex: block * entrants.length + rotation });
  }
}
const assignments = Array.from({ length: workerCount }, () => []);
tasks.forEach((task, index) => assignments[index % workerCount].push(task));
const started = performance.now();
const chunks = await Promise.all(assignments.map((workerTasks) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL("./ai-balanced-worker.mjs", import.meta.url), {
    workerData: {
      generationIds,
      tasks: workerTasks,
      seed,
      playersPerGame,
      maxSteps: 10_000,
    },
  });
  worker.once("message", resolve);
  worker.once("error", reject);
})));
const results = chunks.flat().sort((left, right) => left.gameIndex - right.gameIndex)
  .map(({ result }) => result);
const tournament = addConfidenceIntervals(summarizeTournamentResults(
  results,
  entrants,
  { playersPerGame, seed },
));
const blockRates = strategyBlockWinRates(results, entrants.map((entrant) => entrant.name));
const baseline = entrants[0].name;
const comparisons = entrants.slice(1).map((entrant) => ({
  strategy: entrant.name,
  ...pairedBootstrapDifference(blockRates[entrant.name], blockRates[baseline], {
    seed,
    iterations: 10_000,
  }),
}));
const comparisonStrategyNames = comparisonNames?.map((value) => {
  const generationIndex = generationIds.indexOf(value);
  const entrant = generationIndex >= 0
    ? entrants[generationIndex]
    : entrants.find((candidate) => candidate.name === value);
  if (!entrant) {
    throw new Error(`Unknown comparison entrant: ${value}`);
  }
  return entrant.name;
});
const directComparison = comparisonStrategyNames
  ? {
    left: comparisonStrategyNames[0],
    right: comparisonStrategyNames[1],
    ...pairedBootstrapDifference(
      blockRates[comparisonStrategyNames[0]],
      blockRates[comparisonStrategyNames[1]],
      { seed, iterations: 10_000 },
    ),
  }
  : null;
const runtimeMs = performance.now() - started;
console.log(`Alien Frontiers balanced tournament: ${blocks} seed blocks, ${games} games, ${workerCount} workers, ${(runtimeMs / 1000).toFixed(2)}s`);
console.table(tournament.standings.map((standing) => ({
  strategy: standing.strategy,
  wins: standing.wins,
  winRate: `${(standing.winRate * 100).toFixed(1)}%`,
  win95: `${(standing.winRate95.low * 100).toFixed(1)}-${(standing.winRate95.high * 100).toFixed(1)}%`,
  avgVP: standing.averageVictoryPoints.toFixed(2),
  avgDecisionMs: standing.averageDecisionMs.toFixed(3),
  dnfRate: `${(standing.didNotFinishRate * 100).toFixed(1)}%`,
})));
for (const comparison of comparisons) {
  console.log(`${comparison.strategy} - ${baseline}: ${(comparison.estimate * 100).toFixed(1)}pp `
    + `(paired block bootstrap 95% ${(comparison.low * 100).toFixed(1)} to ${(comparison.high * 100).toFixed(1)}pp, `
    + `P(>0) ${(comparison.probabilityGreaterThanZero * 100).toFixed(1)}%)`);
}
if (directComparison) {
  console.log(`${directComparison.left} - ${directComparison.right}: `
    + `${(directComparison.estimate * 100).toFixed(1)}pp `
    + `(paired block bootstrap 95% ${(directComparison.low * 100).toFixed(1)} to `
    + `${(directComparison.high * 100).toFixed(1)}pp, P(>0) `
    + `${(directComparison.probabilityGreaterThanZero * 100).toFixed(1)}%)`);
}
if (outputPath) {
  const snapshot = {
    schemaVersion: 2,
    balanced: true,
    generatedAt: new Date().toISOString(),
    blocks,
    games,
    seed,
    playersPerGame,
    workerCount,
    generationIds,
    runtimeMs,
    standings: tournament.standings,
    baselineComparisons: comparisons,
    directComparison,
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${outputPath}`);
}
