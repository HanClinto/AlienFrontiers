import { parentPort, workerData } from "node:worker_threads";

import { productionAIStrategy } from "../alien-frontiers-web/js/game/ai-analysis.js";
import { simulateGame } from "../alien-frontiers-web/js/game/ai-simulation.js";

const results = workerData.tasks.map((task) => {
  const strategies = task.aiIds.map((id) => productionAIStrategy(id, {
    maxNodes: workerData.maxNodes,
  }));
  const result = simulateGame({
    strategies,
    seed: task.seed,
    maxSteps: workerData.maxSteps,
  });
  return {
    ...result,
    gameId: task.gameId,
    block: task.block,
    rotation: task.rotation,
    playerCount: task.playerCount,
    tournament: task.tournament,
    matchup: task.matchup,
    aiIds: task.aiIds,
  };
});

parentPort.postMessage(results);