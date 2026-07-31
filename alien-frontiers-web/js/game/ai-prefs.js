const STORAGE_KEY = "alien-frontiers:ai-search";

export const AI_SEARCH_PRESETS = Object.freeze([
  Object.freeze({ id: "quick", label: "QUICK", maxNodes: 3_200, maxTimeMs: 2_000 }),
  Object.freeze({ id: "standard", label: "STANDARD", maxNodes: 6_400, maxTimeMs: 4_400 }),
  Object.freeze({ id: "deep", label: "DEEP", maxNodes: 12_800, maxTimeMs: 7_400 }),
]);

export class AISearchPreferences {
  constructor(storage = typeof localStorage === "undefined" ? null : localStorage) {
    this.storage = storage;
    const savedID = storage?.getItem(STORAGE_KEY);
    this.preset = AI_SEARCH_PRESETS.find((candidate) => candidate.id === savedID)
      ?? AI_SEARCH_PRESETS[1];
  }

  setPreset(id) {
    const preset = AI_SEARCH_PRESETS.find((candidate) => candidate.id === id);
    if (!preset) {
      return false;
    }
    this.preset = preset;
    this.storage?.setItem(STORAGE_KEY, preset.id);
    return true;
  }

  cyclePreset() {
    const index = AI_SEARCH_PRESETS.indexOf(this.preset);
    this.setPreset(AI_SEARCH_PRESETS[(index + 1) % AI_SEARCH_PRESETS.length].id);
    return this.preset;
  }

  optionsFor(state) {
    return {
      policy: "legacy-compact",
      maxNodes: this.preset.maxNodes,
      maxDepth: 100,
      maxChildren: 800,
      timeBudgetMs: Math.min(
        this.preset.maxTimeMs,
        state.currentPlayer.aiType >= 3 ? 7_400 : 4_400,
      ),
    };
  }
}