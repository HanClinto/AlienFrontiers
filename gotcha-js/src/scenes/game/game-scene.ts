import { Coordinate } from "../../game/coordinate.js";
import { gameEnded, pieceSpriteSelected, waitingForAction } from "../../game/game_events";
import { GameAction, GameState } from "../../game/game_state";
import { GameSetup } from "../../game/setup/game_setup";
import { clamp } from "../../helpers";
import { bus, CENTER_X, CENTER_Y } from "../../main";
import { MenuButton } from "../../ui/menu-button";
import { DieSprite } from "./die-sprite";
import { PieceSprite } from "./piece-sprite";
import { PossibleMoveSprite } from "./possible-move-sprite";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: 'Game',
};

export const SQUARE_SIZE = 32;
export const SQUARE_HALF = SQUARE_SIZE / 2;

export class GameScene extends Phaser.Scene {
    public setup: GameSetup;
    public state: GameState;

    pieceSprites: PieceSprite[][] = [];
    diceSprites: DieSprite[] = [];
    possibleMoveSprites: PossibleMoveSprite[] = [];

    private _selectedPiece: PieceSprite;

    public get selectedPiece(): PieceSprite {
        return this._selectedPiece;
    }
    public selectPiece(pieceSprite: PieceSprite) {
        if (pieceSprite == null || this.canSelectPiece(pieceSprite)) {
            this._selectedPiece = pieceSprite;
            bus.publish(pieceSpriteSelected({ pieceSprite }));

            this.showPossibleMoves(pieceSprite);
        }
    }

    public canSelectPiece(pieceSprite: PieceSprite): boolean {
        return pieceSprite.player.isActive
            && pieceSprite.piece.isActive
            && this.state.waitingForAction == GameAction.MOVE_PIECE;
    }

    public showPossibleMoves(pieceSprite: PieceSprite) {
        // Clear all old possible move sprites
        this.possibleMoveSprites.forEach(sprite => sprite.destroy());

        // Create new possible move sprites
        if (pieceSprite) {
            const piece = pieceSprite.piece;
            const possibleMoves = piece.getPossibleMoves(2);
            console.log("Possible moves: ", possibleMoves);
            possibleMoves.forEach(move => {
                const sprite = new PossibleMoveSprite(this, piece.player.index, piece.index, move);
                this.possibleMoveSprites.push(sprite);
            });
        }
    }
    public moveSelectedPieceTo(coord: Coordinate) {
        if (this.selectedPiece) {
            const selPiece = this.selectedPiece;
            this.selectPiece(null);
            this.state.movePiece(selPiece.piece, coord);
        }
        throw new Error('Method not implemented.');
    }

    rollButton: MenuButton;

    boardPxHalfWidth: number;
    boardPxHalfHeight: number;

    constructor() {
        super(sceneConfig);
    }

    public init(data: GameSetup) {
        this.setup = data;

        this.boardPxHalfWidth = SQUARE_SIZE * 0.5 * (this.setup.boardWidth - 1);
        this.boardPxHalfHeight = SQUARE_SIZE * 0.5 * (this.setup.boardHeight - 1);

        this.subscribeToEvents();
    }

    private subscribeToEvents() {
        this.input.on('dragstart', this.dragStart.bind(this));
        this.input.on('drag', this.drag.bind(this));
        this.input.on('dragend', this.dragEnd.bind(this));

        bus.subscribe(waitingForAction, this.waitingForAction.bind(this));
        bus.subscribe(gameEnded, this.gameEnded.bind(this));
    }

    public create(): void {
        this.createState();
        this.createGui();
        this.createBoard();
        this.createPieces();
        this.createDice();
    }

    private createState() {
        this.state = new GameState(this.setup);
    }
    private createGui() {
        this.add
            .text(CENTER_X, 75, "Gotcha'!", {
                color: '#FFFFFF',
                fontSize: '48px',
            }).setOrigin(0.5);

        this.rollButton = new MenuButton(
            this, CENTER_X - 100, 900,
            'Roll Dice', () =>
            this.state.rollDice()
        );
    }

    private waitingForAction() {
        console.log(`Waiting for action: ${this.state.waitingForAction.toString()}`);
        console.log(`Rolling dice? ${this.state.waitingForAction == GameAction.ROLL_DICE}`);
        const rollActive = this.state.waitingForAction == GameAction.ROLL_DICE;

        this.rollButton.setActive(rollActive);
    }

    private gameEnded() {
        console.log("Game ended");
        this.scene.start('MainMenu');
    }

    private dragStart(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) {
        gameObject.setTint(0x999999);
    }

    private drag(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) {
        let [x, y] = this.pixelToBoard(dragX, dragY);

        gameObject.x = this.boardX(x);
        gameObject.y = this.boardY(y);
    }

    private dragEnd(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) {
        gameObject.clearTint();
    }

    private createDice() {
        this.state.dice.forEach((die, i) => {
            const dieSprite = new DieSprite(this,
                CENTER_X - 128 + (i * 256), 800, i);
            this.diceSprites.push(dieSprite);
        });
    }

    // Board coordinates to pixel coordinates
    public boardX(x: number): number {
        return CENTER_X - this.boardPxHalfWidth + x * SQUARE_SIZE;
    }

    // Board coordinates to pixel coordinates
    public boardY(y: number): number {
        return CENTER_Y - 100 - this.boardPxHalfHeight + y * SQUARE_SIZE;
    }

    // Take a pixel coordinate and return the corresponding board coordinates
    private pixelToBoard(pixelX: number, pixelY: number): [number, number] {
        let x = Math.round((pixelX - CENTER_X + this.boardPxHalfWidth) / SQUARE_SIZE);
        let y = Math.round((pixelY - CENTER_Y + this.boardPxHalfHeight) / SQUARE_SIZE);
        return [clamp(x, 0, this.setup.boardWidth - 1), clamp(y, 0, this.setup.boardHeight - 1)];
    }

    private createPieces() {
        const w = this.setup.boardWidth;
        const h = this.setup.boardHeight;

        this.state.players.forEach((player, i) => {
            let playerPieces = [];
            player.pieces.forEach((piece, j) => {
                const pieceSprite = new PieceSprite(this, i, j);
                playerPieces.push(pieceSprite);
            })
            this.pieceSprites.push(playerPieces);
        });
    }

    private createBoard() {
        const w = this.setup.boardWidth;
        const h = this.setup.boardHeight;

        // Border top left corner
        this.add.sprite(
            this.boardX(-1), this.boardY(-1), 'board', 2);
        // Border top right corner
        this.add.sprite(
            this.boardX(w), this.boardY(-1), 'board', 4);

        // Border top middle pieces
        for (let i = 0; i < w; i++) {
            this.add.sprite(
                this.boardX(i), this.boardY(-1), 'board', 3);
        }

        // Border sides
        for (let i = 0; i < h; i++) {
            this.add.sprite(
                this.boardX(-1), this.boardY(i), 'board', 9);
            this.add.sprite(
                this.boardX(w), this.boardY(i), 'board', 11);
        }

        // Border bottom left corner
        this.add.sprite(
            this.boardX(-1), this.boardY(h), 'board', 16);
        // Border bottom right corner
        this.add.sprite(
            this.boardX(w), this.boardY(h), 'board', 18);
        // Border bottom middle pieces
        for (let i = 0; i < w; i++) {
            this.add.sprite(
                this.boardX(i), this.boardY(h), 'board', 17);
        }

        // Board squares
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                const frame = (x + y) % 2 ? 20 : 0;
                this.add.sprite(
                    this.boardX(x), this.boardY(y), 'board', frame);
            }
        }

    }

    public update(): void {

    }
}