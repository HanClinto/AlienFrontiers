import * as Phaser from 'phaser';

export const getGameWidth = (scene: Phaser.Scene): number => {
    return scene.game.scale.width;
};

export const getGameHeight = (scene: Phaser.Scene): number => {
    return scene.game.scale.height;
};

export const clamp = (num: number, min: number, max: number): number => {
    return num <= min
        ? min
        : num >= max
            ? max
            : num
};