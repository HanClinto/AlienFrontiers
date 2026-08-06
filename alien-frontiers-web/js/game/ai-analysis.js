import { AIType } from "./constants.js";
import { legacyCompactStrategy, simpleStrategy } from "./ai-simulation.js";

export const PRODUCTION_AI_IDS = Object.freeze(["simple", "spacer", "admiral", "pirate"]);

export const PRODUCTION_AI_DEFINITIONS = Object.freeze({
  simple: Object.freeze({ name: "Simple", personality: AIType.easy, policy: "simple" }),
  spacer: Object.freeze({ name: "Spacer", personality: AIType.medium, policy: "legacy-compact" }),
  admiral: Object.freeze({ name: "Admiral", personality: AIType.hard, policy: "legacy-compact" }),
  pirate: Object.freeze({ name: "Pirate", personality: AIType.pirate, policy: "legacy-compact" }),
});

export function productionAIStrategy(id, options = {}) {
  const definition = PRODUCTION_AI_DEFINITIONS[id];
  if (!definition) {
    throw new Error(`Unknown production AI: ${id}`);
  }
  const strategy = definition.policy === "simple"
    ? simpleStrategy(definition.name)
    : legacyCompactStrategy(definition.name, {
      maxNodes: options.maxNodes ?? 12_800,
      maxDepth: options.maxDepth ?? 100,
      maxChildren: options.maxChildren ?? 800,
    });
  strategy.id = id;
  strategy.personality = definition.personality;
  strategy.policy = definition.policy;
  return strategy;
}