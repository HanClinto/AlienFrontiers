# Alien Frontiers AI Benchmarks

This ledger tracks experimental AI generations. The deployed web build remains on **Pioneer**
until the validated local routing is intentionally published. Locally, Simple retains SimpleAI;
Spacer, Admiral, and Pirate use worker-backed LegacyCompact with player-selected Quick,
Standard, or Deep limits and SimpleAI fallback.

## Method

- Fixed seeds and deterministic seat rotation make generations directly comparable.
- Promotion runs should use balanced seed blocks: each RNG seed is replayed once for every
  cyclic seat rotation, and paired bootstrap resamples whole seed blocks.
- Win and DNF rates report Wilson 95% confidence intervals.
- Generation differences use paired bootstrap resampling over identical seed/seat results.
- `expand` generations intentionally widen action coverage and may temporarily worsen DNF/runtime.
- `compress` generations optimize hashing, cloning, pruning, or evaluation while preserving coverage.
- Expand/compress work proceeds as a breathing cycle: record the wider action space first, then
  recover throughput and completion before the next expansion.
- A reported no-progress move is a correctness failure, not an acceptable DNF.
- Promotion requires zero correctness stalls, statistically supported strength, and acceptable late-game latency.

### Phase Gates

| Phase | Required signal |
|---|---|
| Expand | New legal action classes are covered; correctness tests pass; DNF/runtime changes are measured, not necessarily improved |
| Compress | Same action coverage; no correctness stalls; DNF and runtime recover; strength confidence interval does not materially regress |
| Promote | Full intended action coverage; zero correctness stalls; acceptable DNF; paired interval supports improvement over Pioneer |

## Generations

| Generation | Phase | Action coverage | Search |
|---|---|---|---|
| Pioneer | baseline | Full SimpleAI policy | Fixed priority; no tree search |
| LegacyParity-400 | parity | Original-style full-turn facilities, tech powers, and constrained field discards | Iterative full-width layers, 400 nodes |
| LegacyParity-12800 | parity | LegacyParity-400 at a dense two-layer budget | Iterative full-width layers, 12,800 nodes |
| LegacyProbe-48 | compress | LegacyParity action policy with pooled selective deeper probing | 12,800 nodes, recycled 48-state beam |
| LegacyCompact-12800 | compress | Full-width LegacyParity with snapshot layers and pooled reconstruction | 12,800 nodes, full-width completed layers |
| LegacyFairProbe-4 | compress | Every LegacyParity root action receives an equal deeper probe budget | 12,800 nodes, 4-state beam/root |
| Surveyor-25 | expand | Core orbital placements | 25 nodes, depth 3, beam 8 |
| Surveyor-100 | compress | Core orbital placements | 100 nodes, depth 5, beam 20 |
| Surveyor-400 | compress | Core orbital placements | 400 nodes, depth 8, beam 48 |
| Homesteader-25 | expand | Surveyor + Constructor, Terraforming, Hub launch, region placement | 25 nodes, depth 3, beam 8 |
| Homesteader-100 | expand | Same as Homesteader-25 | 100 nodes, depth 5, beam 20 |
| Homesteader-400 | expand | Same as Homesteader-25 | 400 nodes, depth 8, beam 48 |
| Homesteader-C1 | compress | Homesteader-400 coverage + original region-bonus valuation | 400 nodes, depth 8, beam 48 |
| Corsair-400 | expand | Homesteader-C1 + atomic Raiders outcomes and deterministic Artifact purchases | 400 nodes, depth 8, beam 48 |
| Corsair-800 | compress | Corsair-400 coverage with a larger breadth budget | 800 nodes, depth 8, beam 48 |
| Corsair-1600 | compress | Corsair-400 coverage with a larger breadth budget | 1,600 nodes, depth 8, beam 48 |
| Corsair-C1 | compress | Corsair-400 coverage with evaluator-ranked Raiders outcomes | 400 nodes, depth 8, beam 48; 12 raid outcomes/straight |
| Corsair-C2 | compress | Corsair-400 coverage with receding-horizon replanning after every action | 400 nodes/search, depth 8, beam 48 |
| Corsair-C3 | compress | Corsair-400 coverage with fair child-budget distribution across each frontier | 400 nodes, depth 8, beam 48 |
| Tactician-400 | expand | Corsair-400 + deterministic active tech powers | 400 nodes, depth 8, beam 48, 320 children/node |
| Strategist-800 | expand | Tactician-400 + implemented tech discard powers | 800 nodes, depth 8, beam 48, 800 children/node |
| Strategist-C1 | compress | Strategist-800 coverage with evaluator-ranked discard outcomes | 400 nodes, depth 8, beam 48; 12 outcomes/discard class |

## Recorded Runs

Trend charts use Mermaid `xychart-beta`; tables remain authoritative when a Markdown renderer
does not support that diagram type.

### LegacyParity Foundation

`LegacyParity` is an independent policy modeled after the original iOS `ExhaustiveAI`:

- Iterative full-width layers with max-descendant backup to root actions.
- Only fully completed depths influence the selected move.
- Replanning after every chosen action.
- Original 3-point undocked-dice penalty and ability to decline non-improving moves.
- Original-style Solar/Lunar singles, qualifying Artifact pairs, atomic Market trades,
  constrained Raider resource mixes, and field-discard guidance.
- Modern fixed-word transpositions, deterministic tests, and tournament infrastructure.

The dense stress fixture has 136 canonical root children. `LegacyParity-400` completes only
one dense layer and exists as a correctness scaffold. About 12,800 nodes / 1.2 seconds are
required to complete two dense layers; 51,200 nodes / 4.6 seconds still completes only two,
closely matching the original engine's multi-second evaluator-dependent operating regime.

#### Original Evaluator Audit

The Legacy evaluator now restores every weight used by the original iOS implementation:

- Fuel 0.30 and ore 0.90 diminishing-return curves.
- Ship 11 + 0.25 per estimated turn; Terraforming removes one counted ship.
- Colony 12, VP 1, Colonist Hub notch 1, and Lunar Mine maximum pip 0.05.
- Artifact ship liability -4, canceled when the Artifact ship is being terraformed.
- Base tech -0.25, except Spacer +0.10; tech value +0.10/card/estimated turn.
- VP-card liability -1; Booster 0.75; Stasis 0.5; Polarity 1; Teleporter/Plasma/Data/Decoy
  1.5; Gravity 0.25; Resource Cache 0.30 per estimated turn.
- +1 for owning any Booster/Stasis/Polarity basic die manipulator.
- All eight original region-control weights, excluding borrowed Data Crystal bonuses and
  respecting Isolation.
- Aggression 0.1/0.3/0.5/0.9, Pirate human prejudice 1.5, terminal value 1,000, and the
  original 3-point undocked-ships penalty.

`AI_VALUE_UNUSED_PIP` was declared in the original but never applied, so it remains absent.
Temporal Warper is not part of the web edition's 20-card deck. Two differences are intentional:
the web keeps deterministic evaluation during search instead of original random noise, and it
uses the smooth resource curve described by the original source comments rather than reproducing
the Objective-C integer-division staircase.

### LegacyParity 100-Game Capability Gate

25 seeds x 4 cyclic seat rotations = 100 games, seeds 27000-27024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | Avg nodes/search | DNF |
|---|---:|---:|---:|---:|---:|---:|---:|
| LegacyParity-12800 | 100 | 75 | 75.0% (65.7-82.5%) | 7.72 | 298.738 ms | 3,084.8 | 0% |
| LegacyParity-400 | 100 | 15 | 15.0% (9.3-23.3%) | 6.03 | 19.594 ms | 189.9 | 0% |
| Corsair-400 | 100 | 7 | 7.0% (3.4-13.7%) | 5.52 | 9.574 ms | 353.6 | 0% |
| Pioneer | 100 | 3 | 3.0% (1.0-8.5%) | 4.38 | 0.047 ms | 0 | 0% |

LegacyParity-12800 beat Corsair-400 by 68.0pp (paired 95% +56.0 to +79.0pp) with zero
DNF. It searched about 70 times/game, averaged 3,085 nodes and 352 ms per searched decision
under eight-worker contention, and selected a broad, plausible action mix across facilities,
Market follow-through, Artifact purchase, raids, active tech powers, and constrained field
discards. Fallback was 0.13%. This is strong evidence that original-style full-turn iterative
search recovers capability that the bounded Corsair beam omitted, but production promotion
still requires a larger paired run plus real-worker desktop/mobile latency and memory checks.

Isolated single-search resource measurements show substantial position-dependent headroom:

| Position | Time | Nodes | Completed depth | Peak heap growth | Peak RSS growth |
|---|---:|---:|---:|---:|---:|
| Early | 45 ms | 174 | 4 | 5 MiB | 22 MiB |
| Reachable midgame | 196 ms | 1,996 | 7 | 33 MiB | 55 MiB |
| Reachable late game | 27 ms | 208 | 6 | 16 MiB | 1 MiB |
| Dense stress | 1.1-1.2 s | 12,800 | 2 | 180-271 MiB | 205-342 MiB |

Retained heap after forced GC was approximately 1 MiB or less, indicating allocation churn
rather than a leak. Dense depth is threshold-sensitive: 3,200-9,600 nodes complete only depth
1, 12,800 completes depth 2, and even 51,200 nodes / 4.6 seconds still completes only depth 2.
Do not raise the production budget above 12,800 until compact search states reduce active
frontier memory; use a worker deadline and a smaller adaptive mobile budget instead.

Testing the original personality deadlines with a high node ceiling confirms that memory,
not desktop patience, is the current constraint:

| Deadline | Nodes | Completed depth | Peak heap growth | Peak RSS growth |
|---:|---:|---:|---:|---:|
| 4.4 s | 48,526 | 2 | 932 MiB | 1,052 MiB |
| 7.4 s | 71,481 | 2 | 1,383 MiB | 1,526 MiB |

Both runs returned the same last fully completed depth as the 12,800-node search. Because
LegacyParity intentionally ignores an interrupted iterative layer, the additional allocation
currently provides no selected-move benefit. Restore original-length production deadlines only
after a compact state arena and/or safe partial-layer backup reduces memory and makes the extra
work usable.

`LegacyProbe-48` tests the arena path independently from the parity baseline. It generates the
same original-style successors, retains the best 48 states per layer for deeper probing, and
returns expanded, duplicate, and pruned `GameState` objects to a `restoreGameSnapshotInto()`
arena. On the dense fixture at the same 12,800-node ceiling:

| Policy | Completed depth | PV depth | Time | Peak heap growth | Arena states |
|---|---:|---:|---:|---:|---:|
| LegacyParity-12800 | 2 | 2 | 1.1-1.2 s | 180-271 MiB | unbounded layer |
| LegacyProbe-16 | 10 | 5 | 219 ms | 31 MiB | 696 |
| LegacyProbe-32 | 10 | 5 | 367 ms | 55 MiB | 1,521 |
| LegacyProbe-48 | 11 | 8 | 389 ms | 74 MiB | 2,362 |
| LegacyProbe-96 | 11 | 5 | 730 ms | 125 MiB | 4,481 |

All probe runs returned every arena state with no leaks and retained about 1 MiB after forced
GC. Beam 48 is the selected experimental balance. It is not parity-equivalent because pruning
changes the policy; tournament strength must determine whether its deeper selective search is
a practical production alternative.

### LegacyProbe 100-Game Gate

25 seeds x 4 cyclic seat rotations = 100 games, seeds 30000-30024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| LegacyParity-12800 | 100 | 60 | 60.0% (50.2-69.1%) | 7.54 | 280.420 ms | 0% |
| LegacyProbe-48 | 100 | 30 | 30.0% (21.9-39.6%) | 6.34 | 21.859 ms | 0% |
| Corsair-400 | 100 | 7 | 7.0% (3.4-13.7%) | 5.52 | 9.493 ms | 0% |
| Pioneer | 100 | 3 | 3.0% (1.0-8.5%) | 4.26 | 0.046 ms | 0% |

LegacyProbe-48 remained substantially stronger than Corsair, but trailed full-width
LegacyParity-12800 by 30.0pp (paired 95% -48.0 to -12.0pp). The arena is a successful
memory mechanism; evaluator-ranked beam pruning is rejected as a replacement policy.
Next, use the arena to recycle states **between completed full-width layers** or store compact
snapshots/positions, preserving broad root backup while reducing active `GameState` memory.

`LegacyCompact-12800` implements that next step: full-width layer semantics are preserved, but
frontier nodes store log-free snapshots plus root-action metadata. One parent and its children
are reconstructed through the arena during expansion, then all live states are returned.

On the dense fixture it selected the identical move and score, completed the same depth, and
visited the same unique positions as LegacyParity-12800:

| Policy | Time | Peak heap growth | Peak RSS growth | Live states | Snapshot frontier |
|---|---:|---:|---:|---:|---:|
| LegacyParity-12800 | 1.19 s | 202 MiB | 330 MiB | full layer | n/a |
| LegacyCompact-12800 | 570 ms | 83 MiB | 154 MiB | 137 | 5,400 |

Compact/full decisions also matched across 12 stable reachable positions and complete seeded
games after preserving terminal status and Artifact-die ordering in snapshots. Pooled search
uses neutral local randomness and does not consume live game RNG/card RNG streams.

### LegacyCompact 100-Game Gate

25 seeds x 4 cyclic seat rotations = 100 games, seeds 33000-33024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Search-only latency | Avg nodes/search | DNF |
|---|---:|---:|---:|---:|---:|---:|---:|
| LegacyParity-12800 | 100 | 50 | 50.0% (40.4-59.6%) | 7.22 | 312.5 ms | 2,961.7 | 0% |
| LegacyCompact-12800 | 100 | 39 | 39.0% (30.0-48.8%) | 6.62 | 144.1 ms | 2,915.4 | 0% |
| Corsair-400 | 100 | 8 | 8.0% (4.1-15.0%) | 5.55 | 39.5 ms | 349.9 | 0% |
| Pioneer | 100 | 3 | 3.0% (1.0-8.5%) | 4.15 | 0 ms | 0 | 0% |

Compact and full parity used nearly identical search effort and action-class distributions,
while Compact reduced search-only latency by about 54%. Their direct tournament difference
was -11.0pp (paired 95% -25.0 to +3.0pp), but placing both policies in the same game changes
the states each later encounters and is not a strict implementation-equivalence test. Fixed
state comparisons across 12 reachable positions and isolated identical-opponent games produced
identical moves, scores, completed depths, unique-state counts, steps, winners, VP totals, and
action sequences. `LegacyCompact-12800` becomes the parity implementation baseline.

Real Chromium module-worker measurements on the dense fixture confirm production viability:

| Profile | Nodes | Completed depth | Worker round trip | Main-thread timer drift |
|---|---:|---:|---:|---:|
| Mobile | 6,400 | 1 | 262 ms | 0.9 ms |
| Desktop | 12,800 | 2 | 409 ms | 0.9 ms |

Three consecutive desktop workers completed in 416, 407, and 397 ms. Each worker was
terminated after its result, and the browser page retained only 0.16 MiB of additional JS heap.
The published scene still uses SimpleAI; these worker profiles remain dormant until promotion.

The worker contract now supports named `legacy-compact` execution and forwards complete action
and budget options. Desktop/mobile profiles retain original personality time allowances while
capping nodes at 12,800/6,400. The pure worker entry point matches in-process LegacyCompact
decisions, scores, completed depth, and unique states.

A positional-array frontier snapshot experiment preserved exact behavior and reduced dense heap
from about 83 MiB to 70-75 MiB, but regressed latency from roughly 570 ms to 683-718 ms because
packing/unpacking still rebuilt substantial temporary structures. It was removed. The proven
log-free object snapshot remains the baseline until a direct compact state model can beat both
time and memory.

Compact 64-bit transposition fingerprints replace retained 85-word keys in LegacyCompact while
exact-key mode remains available as an oracle. Dense exact/fingerprint searches produced the
same move, score, unique-state count, and completed depth; fingerprints improved time from
689 ms to 538 ms and reduced RSS growth from 144 MiB to 72 MiB in the comparison run.

Even after compaction, unrestricted original-length deadlines remain unproductive on the dense
fixture: 4.4 seconds explores ~107k nodes and 7.4 seconds ~179k, but both still complete only
depth 2 and can consume roughly 540/737 MiB heap growth. Additional deadline work therefore
needs fair partial-layer backup rather than a higher global node ceiling.

`LegacyFairProbe-4` gives every legal root action an equal share of the remaining node budget,
then selectively probes deeper within that root. On the dense 12,800-node fixture all 136 root
actions received 93 deeper nodes; the selected move/score matched LegacyParity, peak heap was
about 30 MiB, and the probe reached depth 3 without leaking arena states.

### LegacyFairProbe 100-Game Gate

25 seeds x 4 cyclic seat rotations = 100 games, seeds 36000-36024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| LegacyCompact-12800 | 100 | 41 | 41.0% (31.9-50.8%) | 7.04 | 142.084 ms | 0% |
| LegacyParity-12800 | 100 | 30 | 30.0% (21.9-39.6%) | 6.79 | 250.470 ms | 0% |
| LegacyFairProbe-4 | 100 | 22 | 22.0% (15.0-31.1%) | 6.44 | 26.980 ms | 0% |
| Pioneer | 100 | 7 | 7.0% (3.4-13.7%) | 4.78 | 0.051 ms | 0% |

FairProbe-4 trailed full LegacyParity by 8.0pp (paired 95% -21.0 to +5.0pp), substantially
better than global Probe-48's -30.0pp result but still not enough to replace LegacyCompact as
the desktop baseline. It remains a promising low-memory/mobile policy: every root action is
represented, dense heap is about 30 MiB, and latency is near 27 ms per overall decision under
eight-worker contention.

### Audited Legacy Evaluator 100-Game Gate

25 seeds x 4 cyclic seat rotations = 100 games, seeds 40000-40024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Search-only latency | Avg nodes/search | DNF |
|---|---:|---:|---:|---:|---:|---:|---:|
| LegacyCompact-12800 | 100 | 60 | 60.0% (50.2-69.1%) | 7.45 | 163.9 ms | 3,109.5 | 0% |
| LegacyFairProbe-4 | 100 | 31 | 31.0% (22.8-40.6%) | 6.64 | 25.7 ms | 433.5 | 0% |
| Corsair-400 | 100 | 8 | 8.0% (4.1-15.0%) | 5.57 | 42.0 ms | 352.6 | 0% |
| Pioneer / Simple | 100 | 1 | 1.0% (0.2-5.4%) | 4.24 | 0 ms | 0 | 0% |

After restoring the complete original-used evaluator weights, LegacyCompact beat Simple by
59.0pp (paired 95% +49.0 to +68.0pp) with zero DNF and 0.14% fallback. FairProbe beat Simple
by 30.0pp (+23.0 to +37.0pp). This is the first benchmark snapshot for the audited evaluator;
compare future generations against this run or against Simple rather than assuming older
pre-audit snapshots are directly interchangeable.

### Homesteader Expansion Smoke Test

Command:

```sh
node scripts/run-ai-tournament.mjs --games 100 --seed 1000 --players 4
```

After fixing a full-Solar SimpleAI no-progress loop:

| Strategy | Games | Wins | Win rate | Avg VP | Avg decision | Avg nodes/search | DNF |
|---|---:|---:|---:|---:|---:|---:|---:|
| Homesteader-400 | 100 | 51 | 51% | 7.79 | 21.179 ms | 307.2 | 0% |
| Homesteader-100 | 100 | 26 | 26% | 6.93 | 21.283 ms | 92.3 | 0% |
| Pioneer | 100 | 22 | 22% | 5.94 | 0.125 ms | 0 | 0% |
| Homesteader-25 | 100 | 1 | 1% | 3.28 | 2.467 ms | 23.9 | 0% |

Interpretation: wider search is promising, but 100 games is too noisy for promotion. Homesteader still delegates Raiders, Artifact purchase, and active tech decisions to Pioneer and is not production-complete.

### Mixed 1,000-Game Trend Run

Unbalanced cyclic seat rotation, seeds 1000-1999, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | DNF |
|---|---:|---:|---:|---:|---:|
| Surveyor-400 | 1,000 | 359 | 35.9% (33.0-38.9%) | 7.16 | 0% |
| Homesteader-400 | 1,000 | 315 | 31.5% (28.7-34.4%) | 6.94 | 0% |
| Homesteader-100 | 1,000 | 198 | 19.8% (17.4-22.4%) | 6.43 | 0% |
| Pioneer | 1,000 | 128 | 12.8% (10.9-15.0%) | 5.33 | 0% |

This run is useful for trend strength but not promotion because a seed is not replayed in every seat.

### Balanced 100-Block Expansion Run

100 seeds x 4 cyclic seat rotations = 400 games, seeds 2000-2099, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | DNF |
|---|---:|---:|---:|---:|---:|
| Homesteader-400 | 400 | 151 | 37.8% (33.1-42.6%) | 7.15 | 0% |
| Surveyor-400 | 400 | 122 | 30.5% (26.2-35.2%) | 7.06 | 0% |
| Homesteader-100 | 400 | 84 | 21.0% (17.3-25.3%) | 6.42 | 0% |
| Pioneer | 400 | 43 | 10.8% (8.1-14.2%) | 5.32 | 0% |

Paired seed-block differences versus Pioneer:

- Surveyor-400: +19.8pp (95% bootstrap +13.8 to +26.0pp)
- Homesteader-100: +10.3pp (+5.0 to +15.5pp)
- Homesteader-400: +27.0pp (+20.5 to +33.3pp)

The balanced result reverses the unbalanced Surveyor/Homesteader ordering. Balanced seed
blocks are therefore required for generation promotion decisions.

### Corsair Expansion Smoke Test

25 seeds x 4 cyclic seat rotations = 100 games, seeds 8000-8024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| Corsair-400 | 100 | 36 | 36.0% (27.3-45.8%) | 7.04 | 12.776 ms | 0% |
| Homesteader-C1 | 100 | 33 | 33.0% (24.6-42.7%) | 7.28 | 9.388 ms | 0% |
| Corsair-C1 | 100 | 20 | 20.0% (13.3-28.9%) | 6.46 | 12.837 ms | 0% |
| Pioneer | 100 | 11 | 11.0% (6.3-18.6%) | 5.56 | 0.031 ms | 0% |

Corsair-400 added full atomic Raiders outcomes and deterministic Artifact purchases without
stability loss. Corsair-C1's evaluator-ranked 12-outcome cap regressed by 13.0pp versus
Homesteader-C1 (paired 95% -28.0 to +2.0pp), so broad raid choice remains enabled. The full
generation's 12.8 ms decision time is acceptable for continued expansion.

### Tactician Expansion Smoke Test

25 seeds x 4 cyclic seat rotations = 100 games, seeds 10000-10024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| Homesteader-C1 | 100 | 40 | 40.0% (30.9-49.8%) | 7.31 | 9.284 ms | 0% |
| Corsair-400 | 100 | 27 | 27.0% (19.3-36.4%) | 6.72 | 12.413 ms | 0% |
| Tactician-400 | 100 | 26 | 26.0% (18.4-35.4%) | 6.57 | 13.687 ms | 0% |
| Pioneer | 100 | 7 | 7.0% (3.4-13.7%) | 5.47 | 0.025 ms | 0% |

Tactician-400 was statistically neutral versus Corsair-400 at -1.0pp (paired 95% -11.0
to +9.0pp), with zero DNF and only 1.3 ms additional decision time. Active tech powers
remain enabled while work expands into discard powers.

### Strategist Expansion Smoke Test

25 seeds x 4 cyclic seat rotations = 100 games, seeds 12000-12024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| Corsair-400 | 100 | 43 | 43.0% (33.7-52.8%) | 7.54 | 11.559 ms | 0% |
| Tactician-400 | 100 | 25 | 25.0% (17.5-34.3%) | 6.62 | 12.367 ms | 0% |
| Pioneer | 100 | 19 | 19.0% (12.5-27.8%) | 6.17 | 0.026 ms | 0% |
| Strategist-800 | 100 | 13 | 13.0% (7.8-21.0%) | 5.81 | 26.484 ms | 0% |

Strategist-800 remained stable but regressed 12.0pp versus Tactician-400 (paired 95%
-24.0 to 0.0pp). Its dense fixture exposes 278 discard successors before tech, raid, and
ordinary placements, so the next compression ranks discard outcomes while retaining every
implemented discard class.

### Strategist Compression Smoke Test

25 seeds x 4 cyclic seat rotations = 100 games, seeds 14000-14024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| Strategist-800 | 100 | 35 | 35.0% (26.4-44.7%) | 6.68 | 28.816 ms | 0% |
| Tactician-400 | 100 | 32 | 32.0% (23.7-41.7%) | 6.90 | 13.425 ms | 0% |
| Strategist-C1 | 100 | 21 | 21.0% (14.2-30.0%) | 6.19 | 18.153 ms | 0% |
| Pioneer | 100 | 12 | 12.0% (7.0-19.8%) | 5.89 | 0.026 ms | 0% |

Strategist-C1 regressed 11.0pp versus Tactician-400 (paired 95% -22.0 to 0.0pp), while
the unpruned Strategist-800 recovered to the top point estimate with zero DNF. Per-class
immediate evaluator pruning is rejected; full discard coverage advances to a larger paired run.

### Full-Coverage 100-Block Milestone

100 seeds x 4 cyclic seat rotations = 400 games, seeds 15000-15099, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| Corsair-400 | 400 | 146 | 36.5% (31.9-41.3%) | 7.09 | 11.642 ms | 0% |
| Tactician-400 | 400 | 104 | 26.0% (21.9-30.5%) | 6.77 | 12.500 ms | 0% |
| Strategist-800 | 400 | 80 | 20.0% (16.4-24.2%) | 6.19 | 26.653 ms | 0% |
| Pioneer | 400 | 70 | 17.5% (14.1-21.5%) | 5.99 | 0.021 ms | 0% |

Corsair-400 is the strongest retained generation. Strategist-800 trailed Corsair by 16.5pp
(paired 95% -23.0 to -10.0pp), despite zero DNF and acceptable latency. Optional tech
branches are therefore diluting the global beam; the next compression preserves complete
coverage while limiting how many frontier slots any root action class can occupy.

### Corsair Replanning Smoke Test

25 seeds x 4 cyclic seat rotations = 100 games, seeds 18000-18024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| Corsair-C2 | 100 | 45 | 45.0% (35.6-54.8%) | 7.01 | 16.654 ms | 0% |
| Tactician-400 | 100 | 24 | 24.0% (16.7-33.2%) | 6.43 | 13.504 ms | 0% |
| Corsair-400 | 100 | 19 | 19.0% (12.5-27.8%) | 6.67 | 12.555 ms | 0% |
| Pioneer | 100 | 12 | 12.0% (7.0-19.8%) | 5.43 | 0.025 ms | 0% |

Corsair-C2 improved 26.0pp over Corsair-400 (paired 95% +9.0 to +42.0pp) with zero
DNF. Receding-horizon replanning after each successful action replaces one-search-per-turn
delegation as the retained control-flow policy and advances to a 400-game milestone.

### Corsair Replanning 100-Block Milestone

100 seeds x 4 cyclic seat rotations = 400 games, seeds 19000-19099, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| Corsair-C2 | 400 | 128 | 32.0% (27.6-36.7%) | 6.69 | 14.390 ms | 0% |
| Corsair-400 | 400 | 125 | 31.3% (26.9-36.0%) | 7.01 | 10.999 ms | 0% |
| Tactician-400 | 400 | 84 | 21.0% (17.3-25.3%) | 6.46 | 11.849 ms | 0% |
| Pioneer | 400 | 63 | 15.8% (12.5-19.6%) | 5.97 | 0.020 ms | 0% |

The larger sample reduced Corsair-C2's apparent gain to +0.8pp versus Corsair-400
(paired 95% -7.0 to +8.5pp). Replanning is safe but not yet a demonstrated improvement,
so Corsair-400 remains the conservative strength baseline while evaluator work continues.

### Corsair Depth-Reservation Probe

Corsair-C3 reserved node budgets across depths and frontier entries, increasing the dense
stress fixture's principal variation from depth 2 to depth 4 while using 200 of 400 nodes.
Its corrected 10-block smoke test nevertheless trailed Corsair-400 by 17.5pp (paired 95%
-35.0 to 0.0pp). Equal depth reservation sacrifices too much root selectivity and is rejected.

### Corsair Node-Scaling Smoke Test

25 seeds x 4 cyclic seat rotations = 100 games, seeds 22000-22024, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | DNF |
|---|---:|---:|---:|---:|---:|---:|
| Corsair-1600 | 100 | 30 | 30.0% (21.9-39.6%) | 6.87 | 26.038 ms | 0% |
| Corsair-800 | 100 | 28 | 28.0% (20.1-37.5%) | 6.78 | 20.265 ms | 0% |
| Corsair-400 | 100 | 26 | 26.0% (18.4-35.4%) | 6.90 | 13.031 ms | 0% |
| Pioneer | 100 | 16 | 16.0% (10.1-24.4%) | 5.82 | 0.036 ms | 0% |

Point estimates rise monotonically with node budget, but neither larger generation is yet
statistically distinct from Corsair-400: Corsair-800 is +2.0pp (paired 95% -8.0 to +13.0pp)
and Corsair-1600 is +4.0pp (-9.0 to +18.0pp). Early and reachable midgame positions exhaust
their legal graphs before 400 nodes, so larger budgets add no depth there. The dense stress
position remains depth 2 while transient heap pressure grows from about 18 MiB at 400 nodes
to 26 MiB at 800 and 46 MiB at 1,600; retained heap after GC stays below 0.4 MiB.

### Corsair Node-Scaling 100-Block Milestone

100 seeds x 4 cyclic seat rotations = 400 games, seeds 23000-23099, 8 workers:

| Strategy | Games | Wins | Win rate (95% CI) | Avg VP | Avg decision | Avg nodes/search | DNF |
|---|---:|---:|---:|---:|---:|---:|---:|
| Corsair-1600 | 400 | 127 | 31.8% (27.4-36.5%) | 6.98 | 22.764 ms | 731.8 | 0% |
| Corsair-800 | 400 | 109 | 27.3% (23.1-31.8%) | 6.84 | 18.151 ms | 580.5 | 0% |
| Corsair-400 | 400 | 107 | 26.8% (22.6-31.3%) | 6.70 | 11.432 ms | 363.7 | 0% |
| Pioneer | 400 | 57 | 14.2% (11.2-18.0%) | 5.80 | 0.019 ms | 0 | 0% |

Corsair-1600 leads Corsair-400 by 5.0pp, but the paired 95% interval remains inconclusive
at -2.0 to +12.0pp. Corsair-800 is effectively flat. The 1,600-node budget uses about twice
the average CPU and 2.5 times the dense-position transient heap of Corsair-400 without yet
demonstrating a strength improvement, so Corsair-400 remains the conservative default.

## Statistical Scale

Worst-case independent-game approximation for a 95% win-rate margin:

| Desired margin | Approximate games |
|---|---:|
| ±10 percentage points | 97 |
| ±5 percentage points | 385 |
| ±3 percentage points | 1,068 |
| ±2 percentage points | 2,401 |

Paired fixed-seed comparisons can be more efficient than independent estimates, so promotion decisions should use the observed paired bootstrap interval rather than this table alone.

Recommended cadence:

| Purpose | Suggested sample |
|---|---:|
| Smoke test during expansion | 100 games |
| Routine tuning comparison | ~400 games / 100 balanced seed blocks |
| Milestone generation comparison | ≥1,000 games / 250 balanced seed blocks |
| Close promotion decision | 2,400+ games / 600+ balanced seed blocks |

### Parallel Throughput

On the current 10-logical-CPU development machine, the same 40-game Homesteader field took:

| Workers | Wall time | Speedup |
|---:|---:|---:|
| 1 | 83.97 s | 1.00x |
| 8 | 17.31 s | 4.85x |

Outcomes were identical. At this rate, a 1,000-game ±3pp milestone run is approximately
7 minutes; a 2,401-game ±2pp run is approximately 17 minutes. Decision-time metrics rise
under CPU contention, so compare wall time from equal worker counts and strategy strength
from deterministic outcomes.

## Commands

```sh
# Human-readable standings
node scripts/run-ai-tournament.mjs --games 100 --seed 1000 --players 4

# Machine-readable results
node scripts/run-ai-tournament.mjs --games 100 --seed 1000 --players 4 --json

# Multi-core milestone tournament
node scripts/run-ai-tournament-parallel.mjs \
  --games 1000 \
  --workers 8 \
  --seed 1000 \
  --generations pioneer,homesteader-25,homesteader-100,homesteader-400

# Promotion-quality paired comparison: 250 seeds x all 4 seat rotations
node scripts/run-ai-balanced-parallel.mjs \
  --blocks 250 \
  --workers 8 \
  --seed 1000 \
  --generations pioneer,homesteader-25,homesteader-100,homesteader-400

# Convergence and paired-bootstrap analysis
node scripts/analyze-ai-noise.mjs \
  --sizes 100,250,500,1000 \
  --seed 1000 \
  --generations pioneer,homesteader-25,homesteader-100,homesteader-400

# Persist a JSON + Markdown snapshot for history/graphing
node scripts/write-ai-benchmark.mjs \
  --games 1000 \
  --seed 1000 \
  --label homesteader-1000 \
  --generations pioneer,homesteader-25,homesteader-100,homesteader-400
```

## Next Gates

1. Use LegacyCompact-12800 as the parity baseline; retain LegacyParity-12800 as the full-object oracle.
2. Replace object snapshots with a denser structured search snapshot while preserving deterministic ordering.
3. Forward complete LegacyCompact options through the Web Worker and benchmark desktop/mobile browsers.
4. Restore personality-specific timed budgets and near-equal move variation.
5. Add tactical opportunity evaluation and compound tech-to-payoff actions as a separate LegacyPlus generation.
6. Run a 1,000-game balanced milestone before production promotion.
