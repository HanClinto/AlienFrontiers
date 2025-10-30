import * as Phaser from 'phaser';
import { EventBus } from "ts-bus";
import Scenes from './scenes';

export const bus = new EventBus();
bus.emitter.setMaxListeners(1000);

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: 'Game',
};

export const GAME_WIDTH = 576; // 720;
export const GAME_HEIGHT = 1024; // 1280;

export const CENTER_X = GAME_WIDTH / 2;
export const CENTER_Y = GAME_HEIGHT / 2;

const gameConfig: Phaser.Types.Core.GameConfig = {
    title: "Gotcha'!",

    type: Phaser.AUTO,

    scale: {
        parent: 'game',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.FIT,
    },

    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
        },
    },

    scene: Scenes,

    backgroundColor: '#000000',
};

export const game = new Phaser.Game(gameConfig);
