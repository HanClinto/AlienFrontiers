import * as Phaser from 'phaser';
import { pieceCaptured, pieceMoved, pieceSpriteSelected, waitingForAction } from '../../game/game_events';
import { GameState, Piece, Player } from '../../game/game_state';
import { bus } from '../../main';
import { GameScene } from './game-scene';

const padding = 10;
const minimumWidth = 200;
const minimumHeight = 50;

export class PieceSprite extends Phaser.GameObjects.Sprite {
    private playerIndex: number;
    private pieceIndex: number;
    private gameScene: GameScene;

    private tween: Phaser.Tweens.Tween;
    private moveTween: Phaser.Tweens.Tween;

    private get isSelected(): boolean {
        return this.gameScene.selectedPiece === this;
    }

    public get gameState(): GameState {
        return this.gameScene.state;
    }
    public get player(): Player {
        return this.gameState.players[this.playerIndex];
    }
    public get piece(): Piece {
        return this.player.pieces[this.pieceIndex];
    }

    constructor(scene: GameScene, playerIndex: number, pieceIndex: number) {
        super(scene, 0, 0,
            scene.setup.players[playerIndex].spriteKey,
            scene.setup.players[playerIndex].spriteFrame);

        this.gameScene = scene;
        this.playerIndex = playerIndex;
        this.pieceIndex = pieceIndex;

        this.setInteractive();

        this.onUpdate({});
        this.onSelectChanged({});

        bus.subscribe(pieceMoved, this.onUpdate.bind(this));
        bus.subscribe(pieceSpriteSelected, this.onSelectChanged.bind(this));
        bus.subscribe(pieceCaptured, this.onUpdate.bind(this));
        bus.subscribe(waitingForAction, this.onSelectChanged.bind(this));

        this.setInteractive({ useHandCursor: true })
            .on('pointerover', this.enterHoverState)
            .on('pointerout', this.enterRestState)
            .on('pointerdown', this.enterSelectionState)
            .on('pointerup', this.trySelect);

        scene.add.existing(this);
    }

    private trySelect() {
        if (this.gameScene.canSelectPiece(this)) {
            if (this.isSelected) {
                this.gameScene.selectPiece(null);
            } else {
                this.gameScene.selectPiece(this);
            }
        }
    }

    private enterHoverState() {
        if (this.gameScene.canSelectPiece(this)) {
            this.setTint(0xaaaaaa);
        } else {
            this.enterRestState();
        }
    }

    private enterSelectionState() {
        if (this.gameScene.canSelectPiece(this)) {
            this.setTint(0xaaaaaa);
        } else {
            this.enterRestState();
        }
    }

    private enterRestState() {
        if (this.isSelected) {
            this.setTint(0x888888);
        } else {
            this.clearTint();
        }
    }

    private onSelectChanged(data: any) {
        if (!this.gameScene.selectedPiece
            && this.gameScene.canSelectPiece(this)) {
            this.scale = 1.0;

            if (this.tween) {
                this.tween.stop();
                this.tween = null;
            }
            this.tween = this.gameScene.tweens.add({
                targets: this,
                scale: 1.2,
                duration: 500,
                ease: 'Sine.easeOut',
                yoyo: true,
                delay: 1500,
                repeat: -1,
                repeatDelay: 1000
            });
        } else {
            this.scale = 1.0;
            if (this.tween) {
                this.tween.stop();
                this.tween = null;
            }
            if (this.isSelected) {
                this.setTint(0x888888);
                this.setScale(1.5);
            } else {
                this.clearTint();
            }
        }
    }

    private onUpdate(data: any) {
        const piece = this.piece;

        this.setFrame(piece.isChosen ?
            piece.player.setup.spriteFrameChosen
            : piece.player.setup.spriteFrame);

        if (piece.isChosen) {
            this.setTint(0x888888);
        } else {
            this.clearTint();
        }

        const destX = this.gameScene.boardX(piece.x);
        const destY = this.gameScene.boardY(piece.y);

        this.setVisible(piece.isActive);

        if (this.x !== destX || this.y !== destY) {
            if (this.tween) {
                this.tween.stop();
                this.tween = null;
            }
            this.scale = 1.0;
            const halfwayX = (this.x + destX) / 2;
            const halfwayY = (this.y + destY) / 2;

            this.moveTween = this.gameScene.tweens.add({
                targets: this,
                duration: 500,
                ease: 'Sine.easeIn',
                scale: 2.0,
                x: halfwayX,
                y: halfwayY,
                yoyo: false,
                delay: 0,
            });

            let moveTween2 = this.gameScene.tweens.add({
                targets: this,
                duration: 500,
                ease: 'Sine.easeOut',
                scale: 1.0,
                x: destX,
                y: destY,
                yoyo: false,
                delay: 500,
            });
        }
    }

    private onPieceMoved(data: any) {
        if (data.piece === this.piece) {

        }
    }

}

