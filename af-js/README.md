# Alien Frontiers: Web Edition

This is the web-based port of the Alien Frontiers board game, built with Phaser 3 and TypeScript.

**Current Status**: Phase 8 Complete - Integration & Polish ✅  
**Build**: Hash ed657bb420b9872561a9  
**Tests**: 325/325 passing (100%)  
**Performance**: EXCELLENT ⭐

## Quick Start

### Play the Game Now

**Option 1**: Build and play

```powershell
cd s:\Dev\AlienFrontiers\af-js
.\build.ps1
# Open dist/index.html in your browser
```

**Option 2**: Development server

```powershell
.\start-dev-server.ps1
# Opens at http://localhost:8080
```

**Option 3**: Manual commands

```powershell
$env:NODE_OPTIONS='--openssl-legacy-provider'
npx webpack
# Open dist/index.html
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm

### Installation

```bash
npm install
```

### Development

To run the development server with live reloading:

```bash
npm run dev
```

This will start a development server at `http://localhost:8080` and automatically open your browser.

### Build

To create a production build:

```bash
npm run build
```

The built files will be output to the `dist/` directory.

### Deployment

To serve the built version locally:

```bash
cd dist
npx http-server
```

## Game Features

### Display & UI

- **Fixed Aspect Ratio**: 1536 × 2048 (portrait orientation)
- **Responsive Scaling**: Game scales to fit any screen size with black borders as needed
- **Main Menu**: Title screen with Play, Quick Rules, and Achievements buttons
- **Player Setup**: Configure number of players (2-4) and select controller types

### Core Gameplay

- **Complete Game Implementation**: All 11 orbital facilities functional
- **Territory System**: 8 territories with bonuses and control mechanics
- **Colony Placement**: Interactive territory selection with animations
- **Resource Management**: Ore, Fuel, and Energy with visual feedback
- **Tech Card System**: 13 unique alien technology cards
- **Ship Management**: Build up to 6 ships per player
- **Dice Rolling**: Standard + Bradbury Plateau re-roll bonus

### Interactive Features (Phase 7)

- **Territory Selector Modal**: Choose where to place colonies
- **Raiders Outpost**: 3-step theft system (resources or tech cards)
- **Re-roll Mechanic**: Bradbury Plateau bonus with once-per-turn enforcement
- **Colonist Hub**: Progressive track system for colony construction
- **Visual Feedback**: Colony placement animations, floating resource text, territory control glow

### AI Opponents

- **Cadet AI**: Beginner difficulty
- **Spacer AI**: Intermediate difficulty
- **Pirate AI**: Advanced difficulty
- **Admiral AI**: Expert difficulty with exhaustive search

### Quality & Testing

- **325 Passing Tests**: Comprehensive test coverage
  - 211 game logic tests
  - 114 AI tests
- **TypeScript**: Fully typed codebase
- **Zero Compilation Errors**: Clean builds

## Project Structure

- `src/` - TypeScript source files
  - `game/` - Core game logic
    - `ai/` - AI opponent system (4 difficulty levels)
    - `facilities/` - 11 orbital facilities
    - `tech-cards/` - 13 alien tech cards
    - `game-state.ts` - Central game state management
    - `territory-manager.ts` - Territory control system
    - `ship.ts`, `player.ts`, `types.ts` - Core models
  - `scenes/` - Phaser game scenes
    - `boot-scene.ts` - Asset loading
    - `main-menu-scene.ts` - Main menu
    - `player-setup-scene.ts` - Player configuration
    - `game-scene.ts` - Main game scene (58.7 KiB)
  - `ui/` - UI components and modals
    - `modals/` - Interactive modals (territory selector, raiders, resource picker)
    - `layers/` - HUD layers (player info, turn controls)
    - `sprites/` - Visual components (ships, colonies, facilities)
  - `layers/` - Game overlay layers
    - `player-hud-layer.ts` - Player resource display
    - `facility-layer.ts` - Orbital facility visuals
  - `config/` - Configuration files
    - `board-layout.ts` - Facility and territory positioning
  - `main.ts` - Game initialization
- `__tests__/` - Jest test suites (325 tests)
  - `game/` - Game logic tests
  - `facilities/` - Facility behavior tests
  - `ai/` - AI decision-making tests
  - `ui/` - UI component tests
- `assets/` - Game assets (images, fonts)
  - `game/` - Game board and UI graphics
  - `ui/` - Menu and button assets
- `docs/` - Implementation documentation
  - Phase completion summaries (Phases 1-7)
  - Test plans and architecture docs
- `index.html` - Main HTML entry point
- `webpack.config.js` - Webpack configuration
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest test configuration

## Technology Stack

- **Phaser 3**: Game framework
- **TypeScript**: Programming language (strict mode)
- **Jest**: Testing framework
- **Webpack 4**: Module bundler
- **webpack-dev-server**: Development server with hot reloading

## Current Status

**Phase 7 Complete** (October 31, 2025)

- All core game mechanics implemented
- Full UI with interactive modals
- 4-level AI system
- 325 passing tests
- Bundle size: 481 KiB

**Phase 8 In Progress**: Integration & Polish

## Contributing

See `docs/` folder for detailed implementation documentation and `.agents/` for development workflow.

## License

MIT
