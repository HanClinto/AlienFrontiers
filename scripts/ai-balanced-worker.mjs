import { parentPort, workerData } from "node:worker_threads";

import { generationStrategies } from "../alien-frontiers-web/js/game/ai-generations.js";
import { simulateGame } from "../alien-frontiers-web/js/game/ai-simulation.js";

const entrants = generationStrategies(workerData.generationIds);
const results = workerData.tasks.map(({ block, rotation, gameIndex }) => {
  const strategies = [
    ...entrants.slice(rotation),
    ...entrants.slice(0, rotation),
  ].slice(0, workerData.playersPerGame);
  const result = simulateGame({
    strategies,
    seed: workerData.seed + block,
    maxSteps: workerData.maxSteps,
  });
  result.block = block;
  result.rotation = rotation;
  result.gameIndex = gameIndex;
  return { gameIndex, result };
});
parentPort.postMessage(results);
