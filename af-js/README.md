# Alien Frontiers: Web Edition

This is the web-based port of the Alien Frontiers board game, built with Phaser 3 and TypeScript.

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

- **Fixed Aspect Ratio**: 1536 × 2048 (portrait orientation)
- **Responsive Scaling**: Game scales to fit any screen size with black borders as needed
- **Main Menu**: Title screen with Play, Quick Rules, and Achievements buttons
- **Player Setup**: Configure number of players (2-4) and select controller types:
  - Human
  - Cadet AI
  - Spacer AI
  - Pirate AI
  - Admiral AI

## Project Structure

- `src/` - TypeScript source files
  - `scenes/` - Phaser game scenes
    - `boot-scene.ts` - Asset loading scene
    - `main-menu-scene.ts` - Main menu
    - `player-setup-scene.ts` - Player configuration
  - `ui/` - UI components
    - `menu-button.ts` - Reusable menu button component
  - `main.ts` - Game initialization and configuration
  - `helpers.ts` - Utility functions
- `assets/` - Game assets (images, sounds, etc.)
- `index.html` - Main HTML entry point
- `webpack.config.js` - Webpack configuration
- `tsconfig.json` - TypeScript configuration

## Technology Stack

- **Phaser 3**: Game framework
- **TypeScript**: Programming language
- **Webpack 4**: Module bundler
- **webpack-dev-server**: Development server with hot reloading

## License

MIT