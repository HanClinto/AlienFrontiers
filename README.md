# Alien Frontiers: Kickstarter Edition for Web

Way back in the day (circa 2011), there was a kickstarter for an iOS version of the Alien Frontiers board game. So many people pulled weight and helped -- with programming, with artwork, with design, and with financial backing -- it was a wonderful passion project for me, and I was very thankful to be able to do it.

However, bitrot has set in over the years, and I find even myself unable to play the game that I worked so hard on to enjoy.

I'm sad that so many people contributed to this project, and very few of us still have operating devices that are able to run this old game.

So I've taken it upon myself to see if I can make a reasonable port of the Kickstarter version of the game for the web. This (likely) won't have multiplayer, or expansions, or many of the hopes and dreams that we had for where this game might go.

But hopefully this is a way of letting this stay alive for those of us who loved this game, and hate to see this part of the gaming community die out due to bitrot and overly restrictive iOS store rules.

# Project Goals

* Within reason, to be a faithful reproduction of the Kickstarter version of the iOS board game for Alien Frontiers
* To run seamlessly via a web interface, playable on a static github.io website with no active server required
* To work on mobile, tablet, or desktop devices
* To support the iPad Portrait game layout / resolution, and nothing more.

# Project Technology

The web port is static HTML, CSS, and native JavaScript with no runtime dependencies
or build step. A small Canvas2D compatibility layer preserves the original Cocos2D
coordinate system, centered sprite anchors, parent transforms, z-order, touch priority,
and sprite-frame atlases. Ported scenes and model classes keep the Objective-C structure
and literal iPad coordinates where practical.

See the [Cocos2D Web Shim Parity Audit](COCOS2D_SHIM_AUDIT.md) for active-source usage
counts, semantic-equivalence status, known fidelity gaps, and the prioritized porting
checklist.

# Current Web Port

The main menu and game setup screens are functional, including two-to-four-player
configuration and multiple local human players. The first rules-driven gameplay slice
supports rolling and selecting ships, using the Solar Converter, Maintenance Bay,
Lunar Mine, Shipyard, Orbital Market, Colony Constructor, Colonist Hub, Terraforming
Station, Alien Artifact, and Raiders' Outpost, purchasing or sacrificing ships, purchasing
tech cards, advancing and launching
colonies with the Asimov bonus, cycling the tech display, trading
or raiding resources and cards with Holographic Decoy protection, landing
colonies across all eight regions, scoring majority
victory points, and advancing a pass-and-play turn. The exact 20-card Alien Tech deck is
shuffled and dealt into the original current/opponent trays; Alien City, Alien Monument,
and Resource Cache passive effects are active, along with Booster Pod, Stasis Beam, and
Polarity Device die powers, Gravity Manipulator transfers, and Booster/Stasis/Gravity
region-field discards, plus Data Crystal bonus borrowing and Positron placement. Orbital
Teleporter can reuse a docked die at a different facility, while Plasma Cannon removes
or destroys eligible enemy ships. Teleporter and Polarity discards can move or swap
placed colonies. Heinlein, Van Vogt, Herbert,
Lem, Bradbury, Asimov, and Pohl
majority bonuses affect their connected systems; Burroughs enables the shared artifact
ship while control is maintained. Original background music and core UI,
dice, docking, colony, card, ship, and turn effects play after the first interaction;
ships and player panels use Cocos-style eased movement, tech cards slide elastically into
their trays, and dice scale/rotate when rolled with rotating selection rings. Final colony
placement opens the ranked, blocking game-over results overlay. The lower HUD includes
the live game log, selected tech power/discard descriptions, HELP, and an animated blocking
menu with persistent music/SFX controls, Resume, and Quit. Usable facilities retain white
docks while unavailable docks fade to the original subdued gray.
AI seats automatically play through the ported rules. Simple uses the reliable SimpleAI
heuristic driver; Spacer, Admiral, and Pirate use worker-backed LegacyCompact full-turn
search with their original aggression and human-prejudice profiles. If a search fails,
times out, becomes stale, or has no accepted move, play safely falls back to SimpleAI.
The Options panels expose persistent Quick, Standard, and Deep AI Search limits so players
can choose the appropriate node/time budget for their device rather than relying on automatic
mobile detection. Stable
game states autosave locally, and unfinished
games can be resumed from the main menu after navigation or reload. Original recursive
undo/redo controls restore complete model snapshots without crossing roll or turn boundaries,
and their history survives Resume. Additional animation coverage is still being ported.
LegacyCompact search covers facilities, raids, Artifact purchases, active tech powers, and
the original constrained field-discard policy using rule-aware fungible-die keys, compact
transpositions, pooled state restoration, completed-depth backup, and hard time/node/child
budgets. On timeout it executes the best fully evaluated move. A deterministic
late-game stress fixture gates six-die, dense-dock, field, tech, Data, Plasma, and raid states.
Search runs in a Web Worker so the selected budget does not block rendering or input, with a
hard watchdog beyond each internal deadline. The deployed GitHub Pages build remains on its
last pushed SimpleAI version until the validated local AI changes are intentionally published.

Run seeded headless AI tournaments with:

```sh
node scripts/run-ai-tournament.mjs --games 100 --seed 1000 --players 4
```

The harness rotates strategies through seats and reports win rate, average VP, decision
cost, searched nodes, fallback rate, and did-not-finish rate. Search variants remain
experimental until they complete games reliably and cover active tech/follow-up decisions.
See [AI_BENCHMARKS.md](AI_BENCHMARKS.md) for named generations, historical results,
confidence guidance, and promotion gates.

Run the static site locally from the repository root:

```sh
python3 -m http.server 4173 --directory alien-frontiers-web
```

Then open `http://localhost:4173/`. Run the dependency-free tests with:

```sh
node --test alien-frontiers-web/tests/*.test.js
```

The complete browser project lives in `alien-frontiers-web/`. GitHub Actions publishes
that directory to GitHub Pages on pushes to `main`. Deployment stamps HTML, CSS, every
JavaScript module import, and runtime asset URL with the commit SHA; a no-cache version
manifest also reloads stale open builds under the latest commit-specific URL. Local
development remains a direct static-file workflow with no build step.

# Reference implementations

* Reference screenshots are in the folder `reference-screenshots`. 
* A sample video of the old gameplay is available to view on Vimeo: https://vimeo.com/34362117?fl=pl&fe=vl
