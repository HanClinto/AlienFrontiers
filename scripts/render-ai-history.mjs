#!/usr/bin/env node

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const directory = process.argv[2] ?? "ai-benchmarks";
const output = process.argv[3] ?? join(directory, "HISTORY.md");
const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
const snapshots = await Promise.all(files.map(async (file) => ({
  file,
  data: JSON.parse(await readFile(join(directory, file), "utf8")),
})));
const rows = snapshots.flatMap(({ file, data }) => data.standings.map((standing) => ({
  label: data.label ?? file.replace(/\.json$/, ""),
  generatedAt: data.generatedAt?.slice(0, 10) ?? "",
  strategy: standing.strategy,
  games: standing.games,
  winRate: standing.winRate,
  winLow: standing.winRate95?.low ?? standing.winRate,
  winHigh: standing.winRate95?.high ?? standing.winRate,
  dnfRate: standing.didNotFinishRate,
  decisionMs: standing.averageDecisionMs,
  nodes: standing.averageNodesPerSearch,
})));
const labels = [...new Set(rows.map((row) => row.label))];
const strategies = [...new Set(rows.map((row) => row.strategy))];
const table = rows.map((row) => `| ${row.label} | ${row.generatedAt} | ${row.strategy} | ${row.games} | `
  + `${(row.winRate * 100).toFixed(1)}% (${(row.winLow * 100).toFixed(1)}-${(row.winHigh * 100).toFixed(1)}%) | `
  + `${(row.dnfRate * 100).toFixed(1)}% | ${row.decisionMs.toFixed(3)} ms | ${row.nodes.toFixed(1)} |`).join("\n");
const charts = strategies.map((strategy) => {
  const values = labels.map((label) => {
    const row = rows.find((candidate) => candidate.label === label && candidate.strategy === strategy);
    return row ? Number((row.winRate * 100).toFixed(2)) : "null";
  });
  return `line [${values.join(", ")}]`;
}).join("\n    ");
const markdown = `# AI Generation History\n\n`
  + `Generated from ${files.length} benchmark snapshots.\n\n`
  + `## Win Rate Trend\n\n`
  + `Series order: ${strategies.join(", ")}\n\n`
  + `\`\`\`mermaid\nxychart-beta\n    x-axis [${labels.map((_, index) => index + 1).join(", ")}]\n`
  + `    y-axis "Win rate (%)" 0 --> 100\n    ${charts}\n\`\`\`\n\n`
  + `| Run | Date | Strategy | Games | Win rate (95% CI) | DNF | Avg decision | Avg nodes/search |\n`
  + `|---|---|---|---:|---:|---:|---:|---:|\n${table}\n`;
await writeFile(output, markdown);
console.log(`Wrote ${output}`);
