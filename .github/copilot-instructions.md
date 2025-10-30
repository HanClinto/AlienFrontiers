# Alien Frontiers: Copilot Coding Agent Instructions

## Project Overview

**Alien Frontiers: Kickstarter Edition for Web** - Web port of iOS board game using TypeScript + Phaser 3, deployable to GitHub Pages.

**Primary Goal**: Accurate web port matching original iPad game (1-to-1 pixel matching). Always prioritize matching original behavior.

**Key Facts**: 14 TypeScript files, 61 assets | Node 18+ | Webpack 4 | iOS reference in `alien-frontiers-ios/` | Screenshots in `reference-screenshots/`

## Build & Development

**Setup**: `cd af-js && npm install` (~5 sec) | **Build**: `npm run build` (~3 sec) | **Dev**: `npm run dev` (hot reload on :8080)

**CRITICAL**: Use `npm run` scripts (NODE_OPTIONS already set). Never run raw webpack. No tests/linting configured.

**Always**: Run `npm install` first if dependencies changed. Verify build before commit. Output to `af-js/dist/`.

## Debug & Testing

**URL Params**: `?debug=true` (exposes `__DEBUG__` API) | `?scene=game` (jump to scene)

**Debug API**: `__DEBUG__.goToScene('MainMenu')` | `__DEBUG__.listScenes()` | `__GAME__` (Phaser instance)

**Testing**: Use `npm run dev`, navigate with debug hooks, **take screenshots** of UI changes. **Always expand debug hooks** when adding features.

## Coordinate Systems (CRITICAL)

**iOS Cocos2D**: 768x1024, origin bottom-left, Y up | **Phaser**: 1536x2048 (2x scale), origin top-left, Y down

**Always use helpers** from `src/helpers.ts`: `convertFromIOSCoordinates(x, y)` and `convertIOSChildCoordinates(x, y, height)`

**Porting**: Convert positions AND anchors (iOS default 0.5,0.5 center vs Phaser 0,0 top-left). Assets with `-ipadhd` are 2x.

## Structure

**Root**: `af-js/` (web impl) | `alien-frontiers-ios/` (iOS ref) | `reference-screenshots/` | `docs/` | `.github/workflows/`

**af-js/src**: `main.ts` (entry), `debug.ts`, `helpers.ts` (coords) | `scenes/` (boot, menu, setup, game) | `layers/` (HUDs) | `ui/` (buttons)

**Assets**: `af-js/assets/game/` (board, HUD) and `assets/ui/` (menus). Loaded in `boot-scene.ts`.

**Config**: `package.json` (Phaser 3.55.2, TS 4.1.5, Webpack 4) | `tsconfig.json` (ES5, CommonJS) | `webpack.config.js` | No linting

## iOS Reference

**Primary reference** for logic: `alien-frontiers-ios/AlienFrontiers/`. Key files: `iPhoneGameScene.m`, `LayerHUDPort.m`, `GameState.h/m`, `AIPlayer.m`. AI algorithm details in `docs/ai_writeup.md`.

**Always check iOS first** before implementing features. Extract positions, timings, logic. Convert units and adapt to TypeScript/Phaser.

## CI/CD

**Pipeline**: `.github/workflows/deploy-pages.yml` - Node 18, npm install/build in `af-js/`, deploy dist/ to Pages on push to main.

**Validates**: TypeScript compiles, assets copy. No lint/test. Deploy: `https://hanclinto.github.io/AlienFrontiers/`

## Development Patterns

**New Scene**: Create in `src/scenes/`, add to `index.ts`, add `__DEBUG__.goToScene()`, test with `?scene=name`

**Assets**: Place in `assets/game|ui/`, load in `boot-scene.ts`, reference by filename (no ext). `-ipadhd` = 2x res.

**Porting iOS**: Find `.m` file, note coords/anchors, use conversion helpers, adapt to Phaser APIs, verify vs `reference-screenshots/`

**UI Changes**: Edit src/, `npm run dev`, use debug hooks, **screenshot before/after**, compare to reference, `npm run build`

## Known Issues

**Deprecated packages/vulnerabilities**: Webpack 4 ecosystem, harmless. **Never run `npm audit fix --force`** - breaks build.

**NODE_OPTIONS**: Required for OpenSSL 3. Already in package.json scripts.

**TODOs** (don't fix unless asked): Font XML conversion, Quick Rules scene, Achievements scene.

## Trust These Instructions

These instructions are comprehensive and verified. Only search the codebase if:
1. Information here is incomplete for your specific task
2. You find these instructions contradict actual repository state
3. You need implementation details not covered here (then reference iOS code)

**Always**:
- Run `npm install` before building after dependency changes
- Use `npm run build` (not direct webpack commands)
- Check TypeScript compilation errors
- Test with debug hooks before committing
- Take screenshots of UI changes
- Match original iOS behavior as the primary goal
- Expand debug hooks when adding new features
- Reference iOS implementation in `alien-frontiers-ios/` for game logic
- Convert coordinates using helper functions when porting from iOS

**Never**:
- Run `npm audit fix --force`
- Build without NODE_OPTIONS environment variable (use npm scripts)
- Commit `node_modules/`, `dist/`, or `package-lock.json` (all in .gitignore)
- Modify iOS code in `alien-frontiers-ios/` (reference only)
- Add linting tools unless specifically requested
- Remove or edit working code unless fixing a security vulnerability
