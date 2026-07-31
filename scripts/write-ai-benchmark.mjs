#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { generationStrategies } from "../alien-frontiers-web/js/game/ai-generations.js";
import { addConfidenceIntervals } from "../alien-frontiers-web/js/game/ai-statistics.js";
import { runTournament } from "../alien-frontiers-web/js/game/ai-simulation.js";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const games = Number.parseInt(argument("games", "100"), 10);
const seed = Number.parseInt(argument("seed", "1000"), 10);
const generationIds = argument(
  "generations",
  "pioneer,homesteader-25,homesteader-100,homesteader-400",
).split(",");
const label = argument("label", `games-${games}-seed-${seed}`);
const outputDirectory = argument("output", "ai-benchmarks");
const strategies = generationStrategies(generationIds);
const started = performance.now();
const tournament = addConfidenceIntervals(runTournament({
  entrants: strategies,
  games,
  seed,
  playersPerGame: strategies.length,
}));
const runtimeMs = performance.now() - started;
const snapshot = {
  schemaVersion: 1,
  label,
  generatedAt: new Date().toISOString(),
  games,
  seed,
  generationIds,
  runtimeMs,
  standings: tournament.standings.map((standing) => ({
    strategy: standing.strategy,
    games: standing.games,
    wins: standing.wins,
    winRate: standing.winRate,
    winRate95: standing.winRate95,
    averageVictoryPoints: standing.averageVictoryPoints,
    averageDecisionMs: standing.averageDecisionMs,
    averageNodesPerSearch: standing.averageNodesPerSearch,
    fallbackRate: standing.fallbackRate,
    didNotFinishRate: standing.didNotFinishRate,
    didNotFinishRate95: standing.didNotFinishRate95,
  })),
};
await mkdir(outputDirectory, { recursive: true });
const jsonPath = join(outputDirectory, `${label}.json`);
const markdownPath = join(outputDirectory, `${label}.md`);
await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`);
const rows = snapshot.standings.map((standing) =>
  `| ${standing.strategy} | ${standing.games} | ${(standing.winRate * 100).toFixed(1)}% `
  + `(${(standing.winRate95.low * 100).toFixed(1)}-${(standing.winRate95.high * 100).toFixed(1)}%) `
  + `| ${standing.averageVictoryPoints.toFixed(2)} | ${standing.averageDecisionMs.toFixed(3)} ms `
  + `| ${standing.averageNodesPerSearch.toFixed(1)} | ${(standing.didNotFinishRate * 100).toFixed(1)}% |`,
);
await writeFile(markdownPath, `# ${label}\n\n`
  + `- Games: ${games}\n- Seed start: ${seed}\n- Runtime: ${(runtimeMs / 1000).toFixed(2)} seconds\n\n`
  + `| Strategy | Games | Win rate (95% CI) | Avg VP | Avg decision | Avg nodes/search | DNF |\n`
  + `|---|---:|---:|---:|---:|---:|---:|\n${rows.join("\n")}\n`);
console.log(`Wrote ${jsonPath} and ${markdownPath}`);
