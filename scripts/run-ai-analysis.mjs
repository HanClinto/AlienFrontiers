#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";

import { PRODUCTION_AI_DEFINITIONS, PRODUCTION_AI_IDS } from "../alien-frontiers-web/js/game/ai-analysis.js";
import { wilsonInterval } from "../alien-frontiers-web/js/game/ai-statistics.js";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function combinations(values, size, start = 0, prefix = []) {
  if (prefix.length === size) return [prefix];
  const result = [];
  for (let index = start; index <= values.length - (size - prefix.length); index += 1) {
    result.push(...combinations(values, size, index + 1, [...prefix, values[index]]));
  }
  return result;
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(columns, rows) {
  return `${columns.join(",")}\n${rows.map((row) =>
    columns.map((column) => csvValue(row[column])).join(",")).join("\n")}\n`;
}

function rotate(values, amount) {
  return [...values.slice(amount), ...values.slice(0, amount)];
}

function buildTasks(blocks, seed) {
  const tasks = [];
  for (let block = 0; block < blocks; block += 1) {
    for (const playerCount of [2, 3, 4]) {
      for (const matchup of combinations(PRODUCTION_AI_IDS, playerCount)) {
        for (let rotation = 0; rotation < playerCount; rotation += 1) {
          const aiIds = rotate(matchup, rotation);
          tasks.push({
            gameId: `mixed-p${playerCount}-b${block}-m${matchup.join("-")}-r${rotation}`,
            block,
            rotation,
            playerCount,
            tournament: "mixed",
            matchup: matchup.join("+"),
            aiIds,
            seed: seed + block,
          });
        }
      }
      for (const aiId of PRODUCTION_AI_IDS) {
        tasks.push({
          gameId: `mirror-p${playerCount}-b${block}-${aiId}`,
          block,
          rotation: 0,
          playerCount,
          tournament: "mirror",
          matchup: aiId,
          aiIds: Array.from({ length: playerCount }, () => aiId),
          seed: seed + block,
        });
      }
    }
  }
  return tasks;
}

function countBy(rows, keyFor, predicate = () => true) {
  const counts = new Map();
  for (const row of rows.filter(predicate)) {
    const key = keyFor(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function summaryRows(playerRows, keyFor, predicate) {
  const eligible = playerRows.filter(predicate);
  const games = countBy(eligible, keyFor);
  const wins = countBy(eligible, keyFor, (row) => row.won);
  return [...games].map(([key, count]) => {
    const winCount = wins.get(key) ?? 0;
    return {
      key,
      games: count,
      wins: winCount,
      winRate: winCount / count,
      winRate95: wilsonInterval(winCount, count),
    };
  }).sort((left, right) => right.winRate - left.winRate);
}

function pie(title, rows) {
  return `\`\`\`mermaid\npie showData\n    title ${title}\n${rows.map((row) =>
    `    "${row.key}" : ${row.wins}`).join("\n")}\n\`\`\``;
}

function rateTable(rows, label) {
  return `| ${label} | Wins | Games | Win rate (95% CI) |\n|---|---:|---:|---:|\n${rows.map((row) =>
    `| ${row.key} | ${row.wins} | ${row.games} | ${(row.winRate * 100).toFixed(1)}% `
    + `(${(row.winRate95.low * 100).toFixed(1)}-${(row.winRate95.high * 100).toFixed(1)}%) |`).join("\n")}`;
}

function average(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const blocks = Number.parseInt(argument("blocks", "1"), 10);
const seed = Number.parseInt(argument("seed", "50000"), 10);
const maxNodes = Number.parseInt(argument("max-nodes", "12800"), 10);
const targetHours = Number.parseFloat(argument("target-hours", "9"));
const maxSteps = Number.parseInt(argument("max-steps", "10000"), 10);
const workerCount = Math.max(1, Math.min(
  Number.parseInt(argument("workers", String(Math.max(1, cpus().length - 2))), 10),
  blocks * 40,
));
if (!Number.isInteger(blocks) || blocks <= 0) throw new RangeError("--blocks must be positive");
if (!Number.isInteger(seed)) throw new RangeError("--seed must be an integer");
if (!Number.isInteger(maxNodes) || maxNodes <= 0) throw new RangeError("--max-nodes must be positive");
if (!(targetHours > 0)) throw new RangeError("--target-hours must be positive");

const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim() !== "";
const date = new Date().toISOString().slice(0, 10);
const label = argument("label", `${date}-${commit.slice(0, 8)}-pilot`);
const reportDate = label.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? date;
const outputDirectory = argument("output", join("ai-analysis", "pilots", label));
const tasks = buildTasks(blocks, seed);
const assignments = Array.from({ length: Math.min(workerCount, tasks.length) }, () => []);
tasks.forEach((task, index) => assignments[index % assignments.length].push(task));

const started = performance.now();
const chunks = await Promise.all(assignments.map((workerTasks) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL("./ai-analysis-worker.mjs", import.meta.url), {
    workerData: { tasks: workerTasks, maxNodes, maxSteps },
  });
  worker.once("message", resolve);
  worker.once("error", reject);
})));
const runtimeMs = performance.now() - started;
const results = chunks.flat().sort((left, right) => left.gameId.localeCompare(right.gameId));
const playerRows = results.flatMap((game) => game.players.map((player) => ({
  report_id: label,
  game_id: game.gameId,
  seed: game.seed,
  block: game.block,
  rotation: game.rotation,
  tournament: game.tournament,
  matchup: game.matchup,
  player_count: game.playerCount,
  seat: player.seat,
  ai_id: game.aiIds[player.playerIndex],
  ai_name: player.strategy,
  personality: player.personality,
  won: Number(player.won),
  rank: game.ranking.indexOf(player.playerIndex) + 1,
  victory_points: player.victoryPoints,
  score: player.score,
  completed_rounds: game.turns,
  completed_player_turns: game.turnEstimateSamples.at(-1)?.playerTurn ?? 0,
  steps: game.steps,
  dnf: Number(!game.completed),
  starting_tech: player.startingTech,
  final_tech_count: player.cards,
  decisions: player.decisions,
  searched_decisions: player.searchedDecisions,
  fallback_decisions: player.fallbackDecisions,
  nodes: player.nodes,
  decision_ms: player.elapsedMs,
}))).map((row) => ({ ...row, won: Boolean(row.won) }));

const techRows = results.flatMap((game) => game.players.flatMap((player) => {
  const types = new Set([
    player.startingTech,
    ...player.everOwnedTech,
    ...player.finalTech,
    ...Object.keys(player.techPowerUses),
    ...Object.keys(player.techDiscardUses),
  ]);
  return [...types].filter(Boolean).map((type) => ({
    game_id: game.gameId,
    player_count: game.playerCount,
    tournament: game.tournament,
    seat: player.seat,
    ai_id: game.aiIds[player.playerIndex],
    tech_type: type,
    started_with: Number(player.startingTech === type),
    ever_owned: Number(player.everOwnedTech.includes(type)),
    ended_with: Number(player.finalTech.includes(type)),
    power_uses: player.techPowerUses[type] ?? 0,
    discard_uses: player.techDiscardUses[type] ?? 0,
    won: Number(player.won),
    rank: game.ranking.indexOf(player.playerIndex) + 1,
    victory_points: player.victoryPoints,
  }));
}));
const regionRows = results.flatMap((game) => game.players.flatMap((player) =>
  player.regions.map((region) => ({
    game_id: game.gameId,
    player_count: game.playerCount,
    tournament: game.tournament,
    seat: player.seat,
    ai_id: game.aiIds[player.playerIndex],
    region: region.name,
    final_colonies: region.colonies,
    final_control: Number(region.controlled),
    isolated_at_end: Number(region.isolated),
    won: Number(player.won),
    rank: game.ranking.indexOf(player.playerIndex) + 1,
    victory_points: player.victoryPoints,
  }))));
const estimateRows = results.flatMap((game) => game.turnEstimateSamples.map((sample) => ({
  game_id: game.gameId,
  player_count: game.playerCount,
  tournament: game.tournament,
  player_turn: sample.playerTurn,
  round: sample.round,
  current_seat: sample.currentSeat + 1,
  minimum_colonies_left: Math.min(...sample.coloniesLeft),
  total_queued_colonies: sample.coloniesToLaunch.reduce((total, count) => total + count, 0),
  maximum_active_ships: Math.max(...sample.activeShips),
  estimated_rounds_remaining: sample.estimatedRoundsRemaining,
  actual_rounds_remaining: sample.actualRoundsRemaining,
  actual_player_turns_remaining: sample.actualPlayerTurnsRemaining,
})));

const aiStrength = summaryRows(playerRows, (row) => row.ai_name,
  (row) => row.tournament === "mixed" && row.player_count === 4);
const startingTech = summaryRows(playerRows, (row) => row.starting_tech,
  (row) => row.tournament === "mirror" && row.player_count === 4);
const turnOrder = Object.fromEntries([2, 3, 4].map((playerCount) => [playerCount,
  summaryRows(playerRows, (row) => `Seat ${row.seat}`,
    (row) => row.tournament === "mirror" && row.player_count === playerCount),
]));
const techTypes = [...new Set(techRows.map((row) => row.tech_type))].sort();
const techSummary = techTypes.map((techType) => {
  const rows = techRows.filter((row) => row.tech_type === techType && row.ever_owned);
  const wins = rows.filter((row) => row.won).length;
  const powerUses = rows.reduce((total, row) => total + row.power_uses, 0);
  const discardUses = rows.reduce((total, row) => total + row.discard_uses, 0);
  return {
    techType,
    ownershipGames: rows.length,
    wins,
    winRate: rows.length ? wins / rows.length : 0,
    powerUses,
    discardUses,
    usesPerOwnership: rows.length ? (powerUses + discardUses) / rows.length : 0,
  };
}).sort((left, right) => right.winRate - left.winRate);
const regionNames = [...new Set(regionRows.map((row) => row.region))].sort();
const regionSummary = regionNames.map((region) => {
  const rows = regionRows.filter((row) => row.region === region && row.final_control);
  const wins = rows.filter((row) => row.won).length;
  return {
    region,
    controllers: rows.length,
    wins,
    controllerWinRate: rows.length ? wins / rows.length : 0,
  };
}).sort((left, right) => right.controllerWinRate - left.controllerWinRate);
const gameLength = [2, 3, 4].map((playerCount) => {
  const turns = results.filter((game) => game.playerCount === playerCount && game.completed)
    .map((game) => game.turns);
  return {
    playerCount,
    games: turns.length,
    meanRounds: average(turns),
    medianRounds: median(turns),
    minimumRounds: Math.min(...turns),
    maximumRounds: Math.max(...turns),
  };
});
const estimatorAccuracy = [2, 3, 4].map((playerCount) => {
  const errors = estimateRows.filter((row) => row.player_count === playerCount)
    .map((row) => row.estimated_rounds_remaining - row.actual_rounds_remaining);
  return {
    playerCount,
    samples: errors.length,
    meanError: average(errors),
    meanAbsoluteError: average(errors.map(Math.abs)),
    rootMeanSquaredError: Math.sqrt(average(errors.map((error) => error * error))),
  };
});
const completed = results.filter((game) => game.completed).length;
const gamesPerSecond = results.length / (runtimeMs / 1000);
const projectedGames = Math.floor(gamesPerSecond * targetHours * 3600);
const projectedBlocks = Math.max(1, Math.floor(projectedGames / 40));
const timing = {
  runtimeMs,
  games: results.length,
  gamesPerSecond,
  secondsPerBlock: runtimeMs / 1000 / blocks,
  targetHours,
  projectedGames,
  projectedBlocks,
  projectedRuntimeHours: projectedBlocks * (runtimeMs / 1000 / blocks) / 3600,
};
const summary = {
  aiStrength,
  startingTech,
  turnOrder,
  tech: techSummary,
  regions: regionSummary,
  gameLength,
  estimatorAccuracy,
};
const manifest = {
  schemaVersion: 1,
  reportId: label,
  generatedAt: new Date().toISOString(),
  gameVersion: commit,
  dirty,
  nodeVersion: process.version,
  blocks,
  games: results.length,
  completed,
  seedStart: seed,
  maxNodes,
  maxSteps,
  workerCount: assignments.length,
  aiDefinitions: PRODUCTION_AI_DEFINITIONS,
  timing,
};
const report = `# Alien Frontiers AI Analysis: ${reportDate}\n\n`
  + `- Game version: \`${commit.slice(0, 8)}\`${dirty ? " (dirty pilot)" : ""}\n`
  + `- Games: ${results.length} (${completed} completed)\n`
  + `- Seed blocks: ${blocks}, starting at ${seed}\n`
  + `- Search budget: ${maxNodes.toLocaleString()} nodes\n`
  + `- Runtime: ${(runtimeMs / 1000).toFixed(1)} seconds with ${assignments.length} workers\n\n`
  + `## Four-Player AI Strength\n\n${pie("Four-player AI win share", aiStrength)}\n\n`
  + `${rateTable(aiStrength, "AI")}\n\n`
  + `## Starting Tech\n\nMirror games isolate card effects from mixed AI strength.\n\n`
  + `${pie("Winning starting tech in four-player mirror games", startingTech)}\n\n`
  + `${rateTable(startingTech, "Starting tech")}\n\n`
  + `## Turn Order\n\n${[2, 3, 4].map((playerCount) =>
    `### ${playerCount} Players\n\n${pie(`${playerCount}-player seat win share`, turnOrder[playerCount])}\n\n`
    + rateTable(turnOrder[playerCount], "Turn order")).join("\n\n")}\n\n`
  + `## Tech Ownership And Use\n\nFinal and ever-owned card results are observational associations. `
  + `Power and discard uses are counted separately.\n\n`
  + `| Tech | Ownership games | Owner wins | Owner win rate | Power uses | Discard uses | Uses/ownership |\n`
  + `|---|---:|---:|---:|---:|---:|---:|\n${techSummary.map((row) =>
    `| ${row.techType} | ${row.ownershipGames} | ${row.wins} | ${(row.winRate * 100).toFixed(1)}% | `
    + `${row.powerUses} | ${row.discardUses} | ${row.usesPerOwnership.toFixed(2)} |`).join("\n")}\n\n`
  + `## Final Region Control\n\nFinal control is an observational association, not a causal estimate.\n\n`
  + `| Region | Final controllers | Controller wins | Controller win rate |\n|---|---:|---:|---:|\n`
  + `${regionSummary.map((row) => `| ${row.region} | ${row.controllers} | ${row.wins} | `
    + `${(row.controllerWinRate * 100).toFixed(1)}% |`).join("\n")}\n\n`
  + `## Game Length\n\n| Players | Games | Mean rounds | Median | Range |\n|---:|---:|---:|---:|---:|\n`
  + `${gameLength.map((row) => `| ${row.playerCount} | ${row.games} | ${row.meanRounds.toFixed(2)} | `
    + `${row.medianRounds.toFixed(1)} | ${row.minimumRounds}-${row.maximumRounds} |`).join("\n")}\n\n`
  + `## Turns-Remaining Accuracy\n\nPositive mean error means the current estimator is pessimistic; negative means optimistic.\n\n`
  + `| Players | Samples | Mean error | MAE | RMSE |\n|---:|---:|---:|---:|---:|\n`
  + `${estimatorAccuracy.map((row) => `| ${row.playerCount} | ${row.samples} | ${row.meanError.toFixed(2)} | `
    + `${row.meanAbsoluteError.toFixed(2)} | ${row.rootMeanSquaredError.toFixed(2)} |`).join("\n")}\n\n`
  + `## Timing Projection\n\nThis run completed ${gamesPerSecond.toFixed(3)} games/second. At the same throughput, `
  + `${projectedBlocks.toLocaleString()} complete 40-game blocks (${(projectedBlocks * 40).toLocaleString()} games) `
  + `would take approximately ${timing.projectedRuntimeHours.toFixed(2)} hours.\n\n`
  + `## Raw Data\n\n- [Player-game results](games.csv)\n- [Tech results](tech.csv)\n`
  + `- [Region results](regions.csv)\n- [Turns-remaining samples](turn-estimates.csv)\n`
  + `- [Manifest and timing](manifest.json)\n`;

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(join(outputDirectory, "games.csv"), csv(Object.keys(playerRows[0]), playerRows)),
  writeFile(join(outputDirectory, "tech.csv"), csv(Object.keys(techRows[0]), techRows)),
  writeFile(join(outputDirectory, "regions.csv"), csv(Object.keys(regionRows[0]), regionRows)),
  writeFile(join(outputDirectory, "turn-estimates.csv"), csv(Object.keys(estimateRows[0]), estimateRows)),
  writeFile(join(outputDirectory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`),
  writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
  writeFile(join(outputDirectory, "REPORT.md"), report),
]);

console.log(`Wrote ${outputDirectory}`);
console.log(`${results.length} games in ${(runtimeMs / 1000).toFixed(2)}s (${gamesPerSecond.toFixed(3)} games/s)`);
console.log(`9-hour projection: ${projectedBlocks} blocks / ${projectedBlocks * 40} games / ${timing.projectedRuntimeHours.toFixed(2)}h`);