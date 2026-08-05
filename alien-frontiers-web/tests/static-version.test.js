import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("deployment stamping produces a versioned offline precache manifest", async () => {
  const directory = await mkdtemp(join(tmpdir(), "alien-frontiers-version-"));
  try {
    await mkdir(join(directory, "js"));
    await writeFile(join(directory, "index.html"), '<script src="./js/main.js"></script>');
    await writeFile(join(directory, "js", "main.js"), 'import "./game.js";');
    await writeFile(join(directory, "js", "game.js"), "export {};");
    await mkdir(join(directory, "tests"));
    await writeFile(join(directory, "tests", "app.test.js"), "throw new Error('not deployable');");
    await writeFile(join(directory, "package.json"), "{}");
    await writeFile(join(directory, "service-worker.js"), "self.addEventListener('fetch', () => {});");

    await execFileAsync(process.execPath, [
      new URL("../../scripts/stamp-static-version.mjs", import.meta.url).pathname,
      directory,
      "release-1",
    ]);

    const manifest = JSON.parse(await readFile(join(directory, "precache-manifest.json")));
    assert.equal(manifest.version, "release-1");
    assert.deepEqual(manifest.files, [
      "./index.html?v=release-1",
      "./js/game.js?v=release-1",
      "./js/main.js?v=release-1",
    ]);
    assert.doesNotMatch(manifest.files.join("\n"), /service-worker/);
    assert.doesNotMatch(manifest.files.join("\n"), /tests|package\.json/);
    assert.match(await readFile(join(directory, "index.html"), "utf8"), /main\.js\?v=release-1/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});