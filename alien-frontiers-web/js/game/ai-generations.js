import { exhaustiveStrategy, legacyCompactStrategy, legacyFairProbeStrategy, legacyParityStrategy, legacyProbeStrategy, simpleStrategy } from "./ai-simulation.js";
import { evaluateExhaustiveStateWithoutRegionBonuses } from "./exhaustive-ai.js";

const LEGACY_EVALUATOR = (state) => evaluateExhaustiveStateWithoutRegionBonuses(
  state,
  state.currentPlayerIndex,
);

export const AI_GENERATIONS = Object.freeze({
  pioneer: Object.freeze({
    id: "pioneer",
    name: "Pioneer",
    phase: "baseline",
    description: "Published SimpleAI fallback policy.",
    createStrategy: () => simpleStrategy("Pioneer"),
  }),
  legacyParity400: Object.freeze({
    id: "legacy-parity-400",
    name: "LegacyParity-400",
    phase: "parity",
    description: "Original-style iterative full-turn search on modern state infrastructure.",
    createStrategy: () => legacyParityStrategy("LegacyParity-400", {
      maxNodes: 400,
      maxDepth: 100,
      maxChildren: 800,
    }),
  }),
  legacyParity12800: Object.freeze({
    id: "legacy-parity-12800",
    name: "LegacyParity-12800",
    phase: "parity",
    description: "Original-style iterative full-turn search at a dense two-layer budget.",
    createStrategy: () => legacyParityStrategy("LegacyParity-12800", {
      maxNodes: 12_800,
      maxDepth: 100,
      maxChildren: 800,
    }),
  }),
  legacyProbe48: Object.freeze({
    id: "legacy-probe-48",
    name: "LegacyProbe-48",
    phase: "compress",
    description: "LegacyParity successors with a recycled 48-state selective frontier.",
    createStrategy: () => legacyProbeStrategy("LegacyProbe-48", {
      maxNodes: 12_800,
      maxDepth: 100,
      beamWidth: 48,
      maxChildren: 800,
    }),
  }),
  legacyCompact12800: Object.freeze({
    id: "legacy-compact-12800",
    name: "LegacyCompact-12800",
    phase: "compress",
    description: "Full-width LegacyParity with compact snapshot layers and pooled reconstruction.",
    createStrategy: () => legacyCompactStrategy("LegacyCompact-12800", {
      maxNodes: 12_800,
      maxDepth: 100,
      maxChildren: 800,
    }),
  }),
  legacyFairProbe4: Object.freeze({
    id: "legacy-fair-probe-4",
    name: "LegacyFairProbe-4",
    phase: "compress",
    description: "Equal deeper-search budgets for every LegacyParity root action.",
    createStrategy: () => legacyFairProbeStrategy("LegacyFairProbe-4", {
      maxNodes: 12_800,
      maxDepth: 100,
      maxChildren: 800,
      probeBeamWidth: 4,
    }),
  }),
  surveyor25: Object.freeze({
    id: "surveyor-25",
    name: "Surveyor-25",
    phase: "expand",
    description: "Core orbital search, 25-node beam, no colony successors.",
    createStrategy: () => exhaustiveStrategy("Surveyor-25", {
      maxNodes: 25,
      maxDepth: 3,
      beamWidth: 8,
      includeColonyMoves: false,
      evaluate: LEGACY_EVALUATOR,
    }),
  }),
  surveyor100: Object.freeze({
    id: "surveyor-100",
    name: "Surveyor-100",
    phase: "compress",
    description: "Core orbital search, 100-node beam, no colony successors.",
    createStrategy: () => exhaustiveStrategy("Surveyor-100", {
      maxNodes: 100,
      maxDepth: 5,
      beamWidth: 20,
      includeColonyMoves: false,
      evaluate: LEGACY_EVALUATOR,
    }),
  }),
  surveyor400: Object.freeze({
    id: "surveyor-400",
    name: "Surveyor-400",
    phase: "compress",
    description: "Core orbital search, 400-node beam, no colony successors.",
    createStrategy: () => exhaustiveStrategy("Surveyor-400", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: false,
      evaluate: LEGACY_EVALUATOR,
    }),
  }),
  homesteader25: Object.freeze({
    id: "homesteader-25",
    name: "Homesteader-25",
    phase: "expand",
    description: "Adds Constructor, Terraforming, Hub launch, and region placement.",
    createStrategy: () => exhaustiveStrategy("Homesteader-25", {
      maxNodes: 25,
      maxDepth: 3,
      beamWidth: 8,
      includeColonyMoves: true,
      evaluate: LEGACY_EVALUATOR,
    }),
  }),
  homesteader100: Object.freeze({
    id: "homesteader-100",
    name: "Homesteader-100",
    phase: "expand",
    description: "Colony-aware search with a 100-node beam.",
    createStrategy: () => exhaustiveStrategy("Homesteader-100", {
      maxNodes: 100,
      maxDepth: 5,
      beamWidth: 20,
      includeColonyMoves: true,
      evaluate: LEGACY_EVALUATOR,
    }),
  }),
  homesteader400: Object.freeze({
    id: "homesteader-400",
    name: "Homesteader-400",
    phase: "expand",
    description: "Colony-aware search with a 400-node beam.",
    createStrategy: () => exhaustiveStrategy("Homesteader-400", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: true,
      evaluate: LEGACY_EVALUATOR,
    }),
  }),
  homesteaderC1: Object.freeze({
    id: "homesteader-c1",
    name: "Homesteader-C1",
    phase: "compress",
    description: "Homesteader-400 coverage with all original region bonus weights restored.",
    createStrategy: () => exhaustiveStrategy("Homesteader-C1", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: true,
    }),
  }),
  corsair400: Object.freeze({
    id: "corsair-400",
    name: "Corsair-400",
    phase: "expand",
    description: "Adds atomic Raiders outcomes and deterministic Artifact purchases.",
    createStrategy: () => exhaustiveStrategy("Corsair-400", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
    }),
  }),
  corsair800: Object.freeze({
    id: "corsair-800",
    name: "Corsair-800",
    phase: "compress",
    description: "Corsair action coverage with an 800-node search budget.",
    createStrategy: () => exhaustiveStrategy("Corsair-800", {
      maxNodes: 800,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
    }),
  }),
  corsair1600: Object.freeze({
    id: "corsair-1600",
    name: "Corsair-1600",
    phase: "compress",
    description: "Corsair action coverage with a 1,600-node search budget.",
    createStrategy: () => exhaustiveStrategy("Corsair-1600", {
      maxNodes: 1_600,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
    }),
  }),
  corsairC1: Object.freeze({
    id: "corsair-c1",
    name: "Corsair-C1",
    phase: "compress",
    description: "Ranks Raiders outcomes and retains the best 12 per legal straight.",
    createStrategy: () => exhaustiveStrategy("Corsair-C1", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
      maxRaidOutcomes: 12,
    }),
  }),
  corsairC2: Object.freeze({
    id: "corsair-c2",
    name: "Corsair-C2",
    phase: "compress",
    description: "Corsair-400 replans after every successful action within a turn.",
    createStrategy: () => exhaustiveStrategy("Corsair-C2", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
      repeatSearchWithinTurn: true,
    }),
  }),
  corsairC3: Object.freeze({
    id: "corsair-c3",
    name: "Corsair-C3",
    phase: "compress",
    description: "Corsair-400 distributes each depth's child budget across its frontier.",
    createStrategy: () => exhaustiveStrategy("Corsair-C3", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
      distributeChildrenAcrossFrontier: true,
    }),
  }),
  tactician400: Object.freeze({
    id: "tactician-400",
    name: "Tactician-400",
    phase: "expand",
    description: "Corsair-400 plus all deterministic active tech powers.",
    createStrategy: () => exhaustiveStrategy("Tactician-400", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      maxChildren: 320,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
      includeTechPowerMoves: true,
    }),
  }),
  strategist800: Object.freeze({
    id: "strategist-800",
    name: "Strategist-800",
    phase: "expand",
    description: "Tactician-400 plus all implemented tech discard powers.",
    createStrategy: () => exhaustiveStrategy("Strategist-800", {
      maxNodes: 800,
      maxDepth: 8,
      beamWidth: 48,
      maxChildren: 800,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
      includeTechPowerMoves: true,
      includeTechDiscardMoves: true,
    }),
  }),
  strategistC1: Object.freeze({
    id: "strategist-c1",
    name: "Strategist-C1",
    phase: "compress",
    description: "Ranks and retains the best 12 outcomes for each discard action class.",
    createStrategy: () => exhaustiveStrategy("Strategist-C1", {
      maxNodes: 400,
      maxDepth: 8,
      beamWidth: 48,
      maxChildren: 400,
      includeColonyMoves: true,
      includeRaidArtifactMoves: true,
      includeTechPowerMoves: true,
      includeTechDiscardMoves: true,
      maxTechDiscardMovesPerType: 12,
    }),
  }),
});

export function generationStrategies(ids) {
  return ids.map((id) => {
    const generation = Object.values(AI_GENERATIONS).find((candidate) => candidate.id === id);
    if (!generation) {
      throw new Error(`Unknown AI generation: ${id}`);
    }
    return generation.createStrategy();
  });
}
