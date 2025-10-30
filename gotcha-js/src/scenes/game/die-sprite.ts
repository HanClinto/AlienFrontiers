import * as Phaser from 'phaser';
import { diceRolled, dieUsed, pieceMoved, waitingForAction } from '../../game/game_events';
import { GameAction } from '../../game/game_state';
import { bus } from '../../main';
import { GameScene } from './game-scene';

const padding = 10;
const minimumWidth = 200;
const minimumHeight = 50;

export class DieSprite extends Phaser.GameObjects.Sprite {
    private _isActive: boolean = true;
    private dieIndex: number;
    private gameScene: GameScene;
    private tween: Phaser.Tweens.Tween;

    constructor(scene: GameScene, x: number, y: number, dieIndex: number) {
        super(scene, x, y, 'dice', 0);
        this.gameScene = scene;
        this.dieIndex = dieIndex;

        this.updateDie({});

        bus.subscribe(diceRolled, this.onRoll.bind(this));
        bus.subscribe(pieceMoved, this.updateDie.bind(this));
        bus.subscribe(waitingForAction, this.updateDie.bind(this));
        bus.subscribe(dieUsed, this.updateDie.bind(this));

        scene.add.existing(this);
    }

    private onRoll(data: any) {
        const die = this.gameScene.state.dice[this.dieIndex];

        this.scale = 2.0;
        this.alpha = 0.25;
        this.angle = 45;
        this.visible = true;

        // Set random destination angle to be between -45 and 45
        const destinationAngle = Phaser.Math.Between(-45, 45);


        this.tween = this.gameScene.tweens.add({
            targets: this,
            scale: 1.0,
            alpha: 1.0,
            angle: 180 * (3.5 - die.value),
            duration: 500,
            ease: 'Sine.easeOut',
        });

        this.updateDie(data);
    }

    private updateDie(data: any) {
        const die = this.gameScene.state.dice[this.dieIndex];
        if (data["die"]) {
            if (data["die"] !== die) {
                return;
            }
        }
        this.setFrame(die.value - 1);
        this.alpha = die.active ? 1 : 0.5;
        // Don't show the dice if we're waiting for the player to roll
        this.visible = this.gameScene.state.waitingForAction != GameAction.ROLL_DICE;
    }
}

