#!/usr/bin/env node

import { AI_GENERATIONS, generationStrategies } from "../alien-frontiers-web/js/game/ai-generations.js";
import { runTournament, summarizeTournamentResults } from "../alien-frontiers-web/js/game/ai-simulation.js";
import { addConfidenceIntervals, estimatedGamesForMargin, pairedBootstrapDifference } from "../alien-frontiers-web/js/game/ai-statistics.js";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const seed = Number.parseInt(argument("seed", "1000"), 10);
const sizes = argument("sizes", "100,250,500,1000").split(",").map(Number);
const generationIds = argument(
  "generations",
  "pioneer,homesteader-25,homesteader-100,homesteader-400",
).split(",");
const maxGames = Math.max(...sizes);
const strategies = generationStrategies(generationIds);
const tournament = runTournament({ entrants: strategies, games: maxGames, seed });
const report = [];

for (const size of sizes) {
  const subset = addConfidenceIntervals(summarizeTournamentResults(
    tournament.results.slice(0, size),
    strategies,
    { playersPerGame: strategies.length, seed },
  ));
  report.push(...subset.standings.map((standing) => ({
    games: size,
    strategy: standing.strategy,
    winRate: standing.winRate,
    margin95: standing.winRate95.margin,
    dnfRate: standing.didNotFinishRate,
    dnfMargin95: standing.didNotFinishRate95.margin,
  })));
}

console.table(report.map((row) => ({
  games: row.games,
  strategy: row.strategy,
  winRate: `${(row.winRate * 100).toFixed(1)}%`,
  winMargin95: `±${(row.margin95 * 100).toFixed(1)}pp`,
  dnfRate: `${(row.dnfRate * 100).toFixed(1)}%`,
  dnfMargin95: `±${(row.dnfMargin95 * 100).toFixed(1)}pp`,
})));

const outcomes = new Map(generationIds.map((id) => {
  const generation = Object.values(AI_GENERATIONS).find((candidate) => candidate.id === id);
  return [generation.name, []];
}));
for (const game of tournament.results) {
  for (const player of game.players) {
    outcomes.get(player.strategy).push(player.won ? 1 : 0);
  }
}
const baseline = strategies[0].name;
for (const challenger of strategies.slice(1).map((strategy) => strategy.name)) {
  const comparison = pairedBootstrapDifference(
    outcomes.get(challenger),
    outcomes.get(baseline),
    { seed, iterations: 5_000 },
  );
  console.log(`${challenger} - ${baseline}: ${(comparison.estimate * 100).toFixed(1)}pp `
    + `(95% bootstrap ${(comparison.low * 100).toFixed(1)} to ${(comparison.high * 100).toFixed(1)}pp, `
    + `P(>0) ${(comparison.probabilityGreaterThanZero * 100).toFixed(1)}%)`);
}

console.log("Approximate independent-game sample sizes for a 95% worst-case win-rate margin:");
for (const margin of [0.1, 0.05, 0.03, 0.02]) {
  console.log(`  ±${(margin * 100).toFixed(0)}pp: ${estimatedGamesForMargin(margin)} games`);
}
