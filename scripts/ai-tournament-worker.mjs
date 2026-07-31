import { parentPort, workerData } from "node:worker_threads";

import { generationStrategies } from "../alien-frontiers-web/js/game/ai-generations.js";
import { simulateTournamentGame } from "../alien-frontiers-web/js/game/ai-simulation.js";

const entrants = generationStrategies(workerData.generationIds);
const results = workerData.gameIndexes.map((gameIndex) => ({
  gameIndex,
  result: simulateTournamentGame({
    entrants,
    gameIndex,
    seed: workerData.seed,
    playersPerGame: workerData.playersPerGame,
    maxSteps: workerData.maxSteps,
  }),
}));
parentPort.postMessage(results);
