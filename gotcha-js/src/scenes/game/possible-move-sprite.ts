import * as Phaser from 'phaser';
import { Coordinate } from '../../game/coordinate';
import { pieceMoved, pieceSpriteSelected } from '../../game/game_events';
import { GameState, Piece, Player } from '../../game/game_state';
import { bus } from '../../main';
import { GameScene } from './game-scene';

const DEFAULT_SCALE: number = 1.5;

export class PossibleMoveSprite extends Phaser.GameObjects.Sprite {
    private playerIndex: number;
    private pieceIndex: number;
    private gameScene: GameScene;
    private coord: Coordinate;

    public get gameState(): GameState {
        return this.gameScene.state;
    }
    public get player(): Player {
        return this.gameState.players[this.playerIndex];
    }
    public get piece(): Piece {
        return this.player.pieces[this.pieceIndex];
    }

    constructor(scene: GameScene, playerIndex: number, pieceIndex: number, coord: Coordinate) {
        super(scene, 0, 0,
            "checkers",
            4);

        this.gameScene = scene;
        this.playerIndex = playerIndex;
        this.pieceIndex = pieceIndex;
        this.coord = coord;

        this.x = scene.boardX(coord.x);
        this.y = scene.boardY(coord.y);
        this.scale = DEFAULT_SCALE;

        /*
        let valid = true;

        // Check to see if we're within bounds of the board
        if (this.x < 0 || this.x > this.gameScene.setup.boardWidth
            || this.y < 0 || this.y > this.gameScene.setup.boardHeight) {
            valid = false;
        }

        // If we would land on a friendly piece and that's not allowed in the game rules, then we're not valid
        let landingPiece = this.gameState.getPieceAt(coord.x, coord.y);
        const otherPieceIsFriendly = landingPiece && landingPiece.player.index === this.player.index;
        const otherPieceIsEnemy = landingPiece && landingPiece.player.index !== this.player.index;

        if (otherPieceIsFriendly && !this.gameState.setup.option_CaptureFriendlyPieces) {
            valid = false;
        }
        

        if (!valid) {
            this.destroy();
            return;
        }
        */

        // But if we can capture an enemy piece, then highlight it
        //this.setTint(otherPieceIsEnemy ? 0x00aa00 : 0x0000aa);
        this.setTint(0x00aa00);
        this.setAlpha(0.5);

        this.setInteractive();

        bus.subscribe(pieceMoved, this.destroy.bind(this));
        bus.subscribe(pieceSpriteSelected, this.destroy.bind(this));

        this.setInteractive({ useHandCursor: true })
            .on('pointerover', this.enterHoverState)
            .on('pointerout', this.enterRestState)
            .on('pointerdown', this.enterSelectionState)
            .on('pointerup', this.trySelect);

        scene.add.existing(this);
    }

    private trySelect() {
        this.gameScene.moveSelectedPieceTo(this.coord);
    }

    private enterHoverState() {
        this.setScale(DEFAULT_SCALE * 1.2);
    }

    private enterSelectionState() {
        this.setScale(DEFAULT_SCALE * 1.3);
    }

    private enterRestState() {
        this.setScale(DEFAULT_SCALE * 1.0);
    }

}

