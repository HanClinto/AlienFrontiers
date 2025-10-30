import * as Phaser from 'phaser';
import Scenes from './scenes';
import { exposeDebugAPI, getStartScene } from './debug';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: 'Game',
};

// Fixed aspect ratio: 1536 × 2048 (portrait)
export const GAME_WIDTH = 1536;
export const GAME_HEIGHT = 2048;

export const CENTER_X = GAME_WIDTH / 2;
export const CENTER_Y = GAME_HEIGHT / 2;

const gameConfig: Phaser.Types.Core.GameConfig = {
    title: "Alien Frontiers",

    type: Phaser.AUTO,

    scale: {
        parent: 'game',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.FIT,
    },

    scene: Scenes,

    backgroundColor: '#000000',
};

export const game = new Phaser.Game(gameConfig);

// Expose debug API for testing
exposeDebugAPI(game);

// Support URL parameters to start at specific scene
// Usage: ?scene=Game or ?scene=PlayerSetup
const startScene = getStartScene();
if (startScene) {
  game.events.once('ready', () => {
    const sceneKey = startScene.charAt(0).toUpperCase() + startScene.slice(1);
    console.log(`Starting at scene: ${sceneKey} (from URL parameter)`);
    
    // Stop boot scene and start requested scene
    setTimeout(() => {
      game.scene.stop('Boot');
      const data = sceneKey === 'Game' ? { numPlayers: 2 } : {};
      game.scene.start(sceneKey, data);
    }, 100);
  });
}
