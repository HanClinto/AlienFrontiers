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
        // Use SHOW_ALL to ensure full game is visible (may add letterboxing)
        // Alternative: RESIZE would fill screen but change game dimensions
        expandParent: true,
        autoRound: true,
    },

    scene: Scenes,

    backgroundColor: '#000000',
};

export const game = new Phaser.Game(gameConfig);

console.log('Game initialized', game);

// Expose debug API for testing
exposeDebugAPI(game);

// Support URL parameters to start at specific scene
// Usage: ?scene=game or ?scene=playersetup
const startScene = getStartScene();
if (startScene) {
  game.events.once('ready', () => {
    const sceneKey = startScene.charAt(0).toUpperCase() + startScene.slice(1);
    console.log(`URL parameter detected: will navigate to ${sceneKey} after assets load`);
    
    // Wait for Boot scene to finish loading assets, then navigate
    const bootScene = game.scene.getScene('Boot');
    if (bootScene) {
      bootScene.events.once('create', () => {
        // Give boot scene time to load assets
        setTimeout(() => {
          console.log(`Assets loaded, navigating to: ${sceneKey}`);
          const data = sceneKey === 'Game' ? { numPlayers: 2 } : {};
          game.scene.start(sceneKey, data);
        }, 100);
      });
    }
  });
}
 
