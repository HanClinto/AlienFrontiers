# Alien Frontiers AI Analysis

This directory contains versioned game-balance reports produced by deterministic,
seat-balanced AI tournaments. Each published report is tied to an exact game commit and
includes its raw player-game, tech, region, and turns-remaining CSV data.

## Report Layout

Published reports live under `reports/<date>-<commit>/` and contain:

- `REPORT.md`: charts, confidence intervals, and interpretation.
- `manifest.json`: commit, AI definitions, seeds, search budget, runtime, and reproduction data.
- `summary.json`: machine-readable aggregate results.
- `games.csv`: one row per player per game.
- `tech.csv`: one row per player and encountered tech type.
- `regions.csv`: one row per player and region.
- `turn-estimates.csv`: one row per player-turn estimator checkpoint.

Final tech ownership and region control are observational associations. Starting tech is
randomly dealt, while seat results come from identical-AI mirror games. Reports keep those
evidence classes separate.

## Tournament Schedule

One analysis block contains 40 games:

- Every two-, three-, and four-player combination of Simple, Spacer, Admiral, and Pirate.
- Every cyclic seat rotation for each mixed-AI matchup.
- One identical-AI mirror game for each AI and player count.

Simple uses `SimpleAI`. Spacer, Admiral, and Pirate use LegacyCompact with their production
personality profiles and a shared node budget.

Run a format pilot with:

```sh
node scripts/run-ai-analysis.mjs \
  --blocks 1 --seed 51000 --max-nodes 100 --workers 8 \
  --label 2026-08-05-format-pilot \
  --output ai-analysis/pilots/2026-08-05-format-pilot
```

The representative Deep pilot completed 40 games in 160.90 seconds on eight workers.
At that measured rate, 201 blocks (8,040 games) are projected to take 8.98 hours:

```sh
node scripts/run-ai-analysis.mjs \
  --blocks 201 --seed 60000 --max-nodes 12800 --workers 8 \
  --target-hours 9 \
  --label YYYY-MM-DD-COMMIT \
  --output ai-analysis/reports/YYYY-MM-DD-COMMIT
```

Use a clean worktree for a published report. The manifest records the full commit and whether
the worktree was dirty when the run began. Pilot output remains under `pilots/` and must not be
promoted to the root README as a balance result.

## Pilot Timing

| Pilot | Budget | Games | Workers | Runtime | Throughput | Nine-hour projection |
|---|---:|---:|---:|---:|---:|---:|
| [Format](pilots/2026-08-05-format-pilot/REPORT.md) | 100 nodes | 40 | 8 | 4.71 s | 8.498 games/s | 275,280 games |
| [Deep](pilots/2026-08-05-deep-timing-pilot/REPORT.md) | 12,800 nodes | 40 | 8 | 160.90 s | 0.249 games/s | 8,040 games |