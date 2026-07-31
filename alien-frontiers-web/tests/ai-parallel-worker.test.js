import assert from "node:assert/strict";
import test from "node:test";
import { Worker } from "node:worker_threads";

import { generationStrategies } from "../js/game/ai-generations.js";
import { runTournament } from "../js/game/ai-simulation.js";

function runWorker(gameIndexes) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../../scripts/ai-tournament-worker.mjs", import.meta.url), {
      workerData: {
        generationIds: ["pioneer"],
        gameIndexes,
        seed: 900,
        playersPerGame: 4,
        maxSteps: 10_000,
      },
    });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
}

test("parallel game shards reproduce sequential seeded outcomes", async () => {
  const generationIds = ["pioneer"];
  const sequential = runTournament({
    entrants: generationStrategies(generationIds),
    games: 8,
    seed: 900,
    playersPerGame: 4,
  });
  const chunks = await Promise.all([
    runWorker([0, 2, 4, 6]),
    runWorker([1, 3, 5, 7]),
  ]);
  const parallel = chunks.flat().sort((left, right) => left.gameIndex - right.gameIndex)
    .map(({ result }) => result);

  assert.deepEqual(
    parallel.map((game) => ({
      seed: game.seed,
      completed: game.completed,
      winnerIndex: game.winnerIndex,
      victoryPoints: game.players.map((player) => player.victoryPoints),
    })),
    sequential.results.map((game) => ({
      seed: game.seed,
      completed: game.completed,
      winnerIndex: game.winnerIndex,
      victoryPoints: game.players.map((player) => player.victoryPoints),
    })),
  );
});
