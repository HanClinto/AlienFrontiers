import * as Phaser from 'phaser';
import Scenes from './scenes';

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
