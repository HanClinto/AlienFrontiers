import { ExhaustiveAI } from "./exhaustive-ai.js";
import { restoreGameSnapshot } from "./game-persistence.js";

self.addEventListener("message", (event) => {
  const { snapshot, options } = event.data;
  try {
    const state = restoreGameSnapshot(snapshot);
    const result = ExhaustiveAI.search(state, {
      generateChildren: (candidate, search) => ExhaustiveAI.orbitalMoves(candidate, {
        maxChildren: Math.min(options.maxChildren, search.remainingNodes),
        shouldContinue: search.shouldContinue,
      }),
      ...options,
      random: Math.random,
    });
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
});
