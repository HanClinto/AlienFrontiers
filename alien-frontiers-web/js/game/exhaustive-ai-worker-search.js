import { ExhaustiveAI } from "./exhaustive-ai.js";
import { restoreGameSnapshot } from "./game-persistence.js";

export function runExhaustiveWorkerSearch(snapshot, options = {}) {
  const state = restoreGameSnapshot(snapshot, () => 0.5, () => 0.5);
  if (options.policy === "legacy-compact") {
    return ExhaustiveAI.searchLegacyCompact(state, {
      timeBudgetMs: options.timeBudgetMs,
      maxNodes: options.maxNodes,
      maxDepth: options.maxDepth,
      maxChildren: options.maxChildren,
    });
  }
  return ExhaustiveAI.search(state, {
    generateChildren: (candidate, search) => ExhaustiveAI.orbitalMoves(candidate, {
      maxChildren: Math.min(options.maxChildren, search.remainingNodes),
      shouldContinue: search.shouldContinue,
      includeColonyMoves: options.includeColonyMoves,
      includeRaidArtifactMoves: options.includeRaidArtifactMoves,
      includeTechPowerMoves: options.includeTechPowerMoves,
      includeTechDiscardMoves: options.includeTechDiscardMoves,
      maxTechDiscardMovesPerType: options.maxTechDiscardMovesPerType,
      maxRaidOutcomes: options.maxRaidOutcomes,
    }),
    timeBudgetMs: options.timeBudgetMs,
    maxNodes: options.maxNodes,
    maxDepth: options.maxDepth,
    beamWidth: options.beamWidth,
  });
}
