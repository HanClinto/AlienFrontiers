import { runExhaustiveWorkerSearch } from "./exhaustive-ai-worker-search.js";

self.addEventListener("message", (event) => {
  const { snapshot, options } = event.data;
  try {
    const result = runExhaustiveWorkerSearch(snapshot, options);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
});
