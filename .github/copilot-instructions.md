# Alien Frontiers: Copilot Coding Agent Instructions

## Project Overview

**Alien Frontiers: Kickstarter Edition for Web** is a web-based port of the iOS board game Alien Frontiers. The project aims to be a faithful reproduction of the Kickstarter version, running seamlessly via a web interface deployable to GitHub Pages.

**Primary Goal**: Create an accurate web port of the original iPad game with 1-to-1 pixel matching whenever possible. Always prioritize matching the original behavior of the game (but ported to a web environment).

### Key Facts
- **Repository Size**: Medium (~300MB for web implementation, ~220MB for iOS reference)
- **Project Type**: TypeScript + Phaser 3 game framework (Webpack 4 bundler)
- **Target**: Web browsers (desktop, tablet, mobile) with static hosting
- **Reference Implementation**: iOS app using Cocos2D (in `alien-frontiers-ios/`)
- **Reference Screenshots**: Available in `reference-screenshots/` folder
- **Node.js Version**: 18+ (CI uses Node 18, local development works with 20+)
- **Primary Language**: TypeScript (14 source files, 61 asset files)

## Build & Development Instructions

### Prerequisites
- Node.js 18+ and npm
- No additional global tools required

### Setup (First Time)
```bash
cd af-js
npm install  # Takes ~4-5 seconds
```

**IMPORTANT**: You MUST use `NODE_OPTIONS=--openssl-legacy-provider` for all build commands due to Webpack 4 compatibility with newer Node versions. This is already configured in package.json scripts.

### Development Server
```bash
cd af-js
npm run dev  # Starts webpack-dev-server at http://localhost:8080, auto-opens browser
```
- Hot reloading enabled
- Writes to `dist/` directory
- Use this for interactive development and testing UI changes

### Production Build
```bash
cd af-js
npm run build  # Takes ~3-4 seconds
```
- Output goes to `af-js/dist/`
- Run this before committing to verify no build errors

### Serving Built Version Locally
```bash
cd af-js/dist
npx http-server  # Serves on http://localhost:8080
```

### Build Validation Steps
1. **Always run `npm install` first** if node_modules is missing or dependencies changed
2. Clean build: `rm -rf dist && npm run build`
3. Check for TypeScript errors in build output
4. Verify assets copied to `dist/assets/`
5. No linting or test commands exist - there are no tests in this repository

## Debugging & Testing

### Debug Hooks
The game includes powerful debug hooks for navigation and testing. Use them extensively:

**URL Parameters**:
- `?debug=true` - Exposes `window.__DEBUG__` API
- `?scene=<sceneName>` - Jump directly to a scene (e.g., `?scene=game`, `?scene=playersetup`)

**Debug API** (when `?debug=true`):
```javascript
__DEBUG__.goToScene('MainMenu')        // Navigate to scene
__DEBUG__.goToScene('Game', {numPlayers: 2})  // With data
__DEBUG__.listScenes()                  // List all available scenes
__DEBUG__.getCurrentScene()             // Get current scene key
__GAME__                                // Direct Phaser game instance access
```

**Available Scene Keys**: `Boot`, `MainMenu`, `Playersetup`, `Game`

### Manual Testing Workflow
1. Build the project: `npm run build`
2. Start dev server: `npm run dev` (or serve from dist)
3. Open browser to `http://localhost:8080?debug=true`
4. Use debug hooks to navigate to the scene you're working on
5. **Take screenshots** of any UI changes for documentation
6. Test on different viewport sizes (game uses responsive scaling)

### Expanding Debug Hooks
When adding new game screens or states, **always extend the debug hooks** to support easier testing:
1. Add URL parameter support in `debug.ts` if needed
2. Expose navigation methods in `__DEBUG__` API
3. Document new debug commands in code comments

## Coordinate System & Resolution

**CRITICAL**: iOS Cocos2D and Phaser use different coordinate systems and resolutions.

### Resolution Differences
- **iOS (Cocos2D)**: 768x1024 base resolution (2x retina scaling = 1536x2048 pixels)
- **Web (Phaser)**: 1536x2048 canvas resolution (double iOS base)
- Assets use `-ipadhd` suffix indicating 2x/retina resolution

### Coordinate System Differences
- **iOS Cocos2D**: Origin (0,0) at **bottom-left**, Y increases upward
- **Phaser**: Origin (0,0) at **top-left**, Y increases downward

### Conversion Functions
Always use helper functions from `src/helpers.ts`:

```typescript
// Convert global coordinates from iOS to Phaser
convertFromIOSCoordinates(x: number, y: number)
// Example: iOS (384, 512) → Phaser (768, 1024)

// Convert child coordinates (for containers)
convertIOSChildCoordinates(iosX, iosY, frameHeightIOS)
// Use for elements positioned relative to container centers
```

### Positioning Guidelines
- Phaser's default anchor point is (0, 0) top-left
- iOS sprites typically use (0.5, 0.5) center anchor
- When porting iOS code, convert both position AND anchor points
- Game canvas: 1536x2048 with `Phaser.Scale.FIT` mode (adds black bars to maintain aspect ratio)

## Project Structure

### Root Directory Files
```
.github/              - Workflows and deployment config
af-js/                - Main web implementation (TypeScript + Phaser)
alien-frontiers-ios/  - Original iOS implementation (Objective-C + Cocos2D) - REFERENCE ONLY
docs/                 - Game rules and AI writeup
gotcha-js/            - Example Phaser project (reference)
reference-screenshots/ - Screenshots from original iOS app
README.md             - Project overview and goals
.gitignore            - Ignores node_modules, dist/, .lock files
```

### af-js/ Directory Structure
```
af-js/
├── src/
│   ├── main.ts              - Entry point, Phaser config, game constants
│   ├── debug.ts             - Debug hooks and URL parameter handling
│   ├── helpers.ts           - Coordinate conversion, color utilities
│   ├── scenes/
│   │   ├── index.ts         - Scene exports
│   │   ├── boot-scene.ts    - Asset loading with progress bar
│   │   ├── main-menu-scene.ts - Title screen
│   │   ├── player-setup-scene.ts - Player/AI configuration
│   │   └── game-scene.ts    - Main game board and HUD coordination
│   ├── layers/
│   │   ├── index.ts
│   │   ├── player-hud-layer.ts      - Main player tray (bottom)
│   │   └── mini-player-hud-layer.ts - Opponent trays (top)
│   └── ui/
│       ├── image-button.ts  - Basic image button component
│       ├── labeled-button.ts - Button with text label
│       └── menu-button.ts   - Menu-style button component
├── assets/              - Game assets (images, fonts)
│   ├── game/           - In-game assets (board, dice, buttons, HUD)
│   └── ui/             - Menu and setup screen assets
├── index.html          - Main HTML entry point
├── package.json        - Dependencies and scripts
├── tsconfig.json       - TypeScript configuration
└── webpack.config.js   - Webpack build configuration
```

### Key Configuration Files
- **package.json**: Scripts (`build`, `dev`), dependencies (Phaser 3.55.2, TypeScript 4.1.5, Webpack 4)
- **tsconfig.json**: Target ES5, CommonJS modules, includes `src/**/*.ts`
- **webpack.config.js**: Entry `main.ts`, output to `dist/`, copies assets and index.html
- **No linting config**: No ESLint, Prettier, or TSLint configured

## iOS Reference Implementation

The original iOS code in `alien-frontiers-ios/AlienFrontiers/` is your PRIMARY reference for game logic and behavior.

### Key iOS Files to Reference
- Scene files: `iPhoneGameScene.m`, `SceneGameOver.m`
- Layer files: `LayerHUDPort.m`, `LayerPortPlayerMiniHUD.m`, `AFLayer.m`
- Region files: `LayerRegion.m`, specific regions like `LayerAsimovCrater.m`
- Game state: `GameState.h/m`, `GameEvents.h`
- AI: `AIPlayer.m`, `ExhaustingAI.h` (see `docs/ai_writeup.md` for algorithms)
- Tech cards: Various `TechCard` subclasses
- Docking bays: `LayerShipyard.m`, `LayerColonyConstructor.m`, etc.

### When to Reference iOS Code
- **Always** check iOS implementation before implementing new game features
- Look for coordinate positions, animation timings, state transitions
- Note: iOS code uses different units (768x1024 base, bottom-left origin)
- Leverage iOS patterns but adapt to TypeScript/Phaser conventions

## CI/CD Pipeline

### GitHub Actions Workflow
File: `.github/workflows/deploy-pages.yml`

**Trigger**: Push to `main` branch

**Steps**:
1. Checkout repository
2. Setup Node.js 18
3. `npm install` (in `af-js/`)
4. `NODE_ENV=production npm run build` (in `af-js/`)
5. Upload `af-js/dist` as artifact
6. Deploy to GitHub Pages

**Deployment URL**: `https://hanclinto.github.io/AlienFrontiers/`

### What Gets Validated
- Build must complete successfully (no TypeScript errors)
- Assets must be copied to dist/
- No linting or testing steps (none configured)

### Common CI Issues
- **Build failures**: Usually TypeScript errors or missing dependencies
- **Asset loading**: Ensure assets are in `af-js/assets/` and referenced correctly
- **NODE_OPTIONS**: Already set in package.json, don't override in CI

## Common Development Patterns

### Adding a New Scene
1. Create scene file in `src/scenes/` extending `Phaser.Scene`
2. Add to `src/scenes/index.ts` exports array
3. Reference scene key in navigation code
4. Add debug navigation: `__DEBUG__.goToScene('NewSceneName')`
5. Test with `?scene=newscenename` URL parameter

### Adding Assets
1. Place in `af-js/assets/game/` or `af-js/assets/ui/`
2. Assets with `-ipadhd` suffix are 2x resolution (1536x2048)
3. Load in `boot-scene.ts` preload()
4. Reference by key (filename without extension)
5. Build and verify copied to `dist/assets/`

### Porting from iOS Code
1. Find corresponding iOS file (usually `Layer*.m` or `Scene*.m`)
2. Note coordinate positions and anchor points
3. Convert coordinates using helper functions
4. Adjust for Phaser's different container/sprite APIs
5. Test visual match against `reference-screenshots/`

### Making UI Changes
1. Modify TypeScript files in `src/`
2. Run `npm run dev` for hot reload
3. Use debug hooks to navigate to screen
4. **Take screenshots** of before/after
5. Compare against reference screenshots
6. Build and verify: `npm run build`

## Known Issues & Workarounds

### Deprecated npm Packages
The build shows warnings about deprecated packages (Webpack 4 ecosystem). These are known and don't affect functionality:
- `copy-concurrently`, `fs-write-stream-atomic`, `move-concurrently`
- `figgy-pudding`, `urix`, `source-map-url`, `resolve-url`, `source-map-resolve`
- `uuid@3.4.0`, `inflight`, `rimraf@2-3`, `glob@7`

**Workaround**: Ignore these warnings. Upgrading to Webpack 5 is out of scope.

### Security Vulnerabilities
npm audit reports 26 vulnerabilities (8 moderate, 17 high, 1 critical). These are in dev dependencies and don't affect the built application.

**Workaround**: Do not run `npm audit fix --force` as it may break Webpack 4 compatibility.

### NODE_OPTIONS Required
All builds must use `NODE_OPTIONS=--openssl-legacy-provider` due to OpenSSL 3 changes breaking Webpack 4.

**Workaround**: Already configured in package.json scripts - use `npm run build` and `npm run dev`.

## TODOs in Codebase
Current known TODOs (do not attempt to fix unless specifically asked):
- `boot-scene.ts`: Convert font to XML format or use WebFont loader for DIN-Black.ttf
- `main-menu-scene.ts`: Implement Quick Rules scene (currently placeholder)
- `main-menu-scene.ts`: Implement Achievements scene (currently placeholder)

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
