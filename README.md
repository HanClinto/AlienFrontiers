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

# Current Web Port

The main menu and game setup screens are functional, including two-to-four-player
configuration and multiple local human players. The first rules-driven gameplay slice
supports rolling and selecting ships, using the Solar Converter, Maintenance Bay,
Lunar Mine, and Shipyard, purchasing additional ships, and advancing a pass-and-play
turn. AI seats automatically play through the ported rules using the original SimpleAI
fallback priority. The remaining facilities, personality-specific ExhaustiveAI strategies,
territories, alien tech cards, undo/redo, saving, audio, and endgame are still being ported.

Run the static site locally from the repository root:

```sh
python3 -m http.server 4173 --directory docs
```

Then open `http://localhost:4173/`. Run the dependency-free tests with:

```sh
node --test docs/tests/*.test.js
```

GitHub Actions publishes `docs/` directly to GitHub Pages on pushes to `main`.

# Reference implementations

* Reference screenshots are in the folder `reference-screenshots`. 
* A sample video of the old gameplay is available to view on Vimeo: https://vimeo.com/34362117?fl=pl&fe=vl
