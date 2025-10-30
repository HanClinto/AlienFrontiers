import { bus } from "../main";
import { Coordinate } from "./coordinate";
import { diceRolled, dieUsed, gameEnded, pieceCaptured, pieceMoved, playerNext, waitingForAction } from "./game_events";
import { GameSetup, PlayerSetup } from "./setup/game_setup";

export const enum GameAction {
    CHOOOSE_CHOSEN = 1,
    ROLL_DICE = 2,
    MOVE_PIECE = 3,

}

export class GameState {
    players: Player[];
    dice: Die[];
    setup: GameSetup;
    activePlayerIndex: integer = 0;
    // Whether or not the game state should publish events to the bus
    publishEvents: boolean = true;

    public dispatch(event: any) {
        // If we are the current game state, then publish the event.
        if (this.publishEvents) {
            bus.publish(event);
        }
    }

    _waitingForAction: GameAction = GameAction.ROLL_DICE;
    public get waitingForAction(): GameAction {
        return this._waitingForAction;
    }
    private waitForAction(action: GameAction) {
        this._waitingForAction = action;
        this.dispatch(waitingForAction({ action: action }));
    }

    public rollDice() {
        // Assert that we are waiting for dice to be rolled
        if (this.waitingForAction != GameAction.ROLL_DICE) {
            throw new Error("Cannot roll dice when not waiting for dice to be rolled");
        }

        this.dice.forEach(die => die.roll());
        this.waitForAction(GameAction.MOVE_PIECE);
        this.dispatch(diceRolled({ dice: this.dice }));
    }

    public get activeDice(): Die[] {
        return this.dice.filter(die => die.active);
    }

    public movePiece(piece: Piece, coord: Coordinate) {
        if (this.waitingForAction != GameAction.MOVE_PIECE) {
            throw new Error("Cannot move piece when not waiting for a piece to be moved");
        }
        // Find the corresponding objects in this state
        if (piece.state != this) {
            piece = this.allPieces.find(p => p.index === piece.index);
        }

        let dice: Die[] = [];

        let die = this.activeDice.find(d => d.value === coord.delta);
        if (die) {
            dice = [die];
        }

        if (dice.length === 0) {

            // HACK: If we can't find a specific die with this value, then assume we used both die to reach this value.
            dice = this.dice;
        }

        for (let die of dice) {
            // Mark our die as used
            if (die.active == false) {
                throw new Error("Cannot move piece with inactive die");
            }

            die.active = false;
            this.dispatch(dieUsed({
                die: die
            }));
        }

        // See if there is another piece at the destination
        let otherPiece = this.getPieceAt(coord.x, coord.y);
        if (otherPiece) {
            // If there is, check to see if it's a Chosen One
            if (otherPiece.isChosen) {
                // If so, then make this piece a Chosen One (if we aren't already)
                piece.isChosen = true;
            }
            // In either case, remove the other piece
            otherPiece.isActive = false;

            this.dispatch(pieceCaptured({
                capturedPiece: otherPiece,
                capturingPiece: piece
            }));

            // And grant us an extra turn
            // TODO: Check game rules to see if we can get another turn
            this.activePlayer.earnedExtraTurn = true;
        }

        // Move the piece to the new location
        piece.x = coord.x;
        piece.y = coord.y;

        this.dispatch(pieceMoved({
            piece: piece,
        }));

        // Check to see if there are any active dice
        let activeDice = this.dice.filter(d => d.active);
        if (activeDice.length == 0) {
            // Check for game end
            // The game is over when the other player runs out of pieces
            if (this.otherPlayer.pieces.filter(p => p.isActive).length == 0) {
                this.dispatch(gameEnded({ winner: this.activePlayer }));
            }

            // Do we pass the turn or not?
            if (this.activePlayer.earnedExtraTurn) {
                this.activePlayer.earnedExtraTurn = false;
            } else {
                this.activePlayerIndex = (1 + this.activePlayerIndex) % 2;
                this.dispatch(playerNext({}));
            }

            this.waitForAction(GameAction.ROLL_DICE);
        }
    }

    // Take a piece index and return the cooresponding board coordinates
    private pieceIndexToXY(piece: number): [number, number] {
        const x = (piece * 2) % this.setup.boardWidth;
        const y = Math.floor((piece * 2) / this.setup.boardWidth);
        return [x, y];
    }

    constructor(gameSetup: GameSetup) {
        this.setup = gameSetup;
        this.players = [];
        this.dice = [
            new Die(this, 4),
            new Die(this, 2)];

        gameSetup.players.forEach((playerSetup, playerIndex) => {
            let player = new Player(this);
            player.index = playerIndex;

            for (let p = 0; p < playerSetup.numPieces; p++) {
                let [x, y] = this.pieceIndexToXY(p);
                if (player.index == 0) {
                    y = gameSetup.boardHeight - 1 - y;
                } else {
                    x = gameSetup.boardWidth - 1 - x;
                }
                let isChosen = p < playerSetup.numChosenPieces;
                let piece = new Piece(
                    player, p, isChosen, x, y);
                player.pieces.push(piece);
            }

            this.players.push(player);
        });

        this._waitingForAction = GameAction.ROLL_DICE;
    }

    get activePlayer(): Player {
        return this.players[this.activePlayerIndex];
    }

    get otherPlayer(): Player {
        return this.players[(1 + this.activePlayerIndex) % 2];
    }

    get allPieces(): Piece[] {
        return this.players.flatMap(player => player.pieces);
    }

    public getPieceAt(x: number, y: number): Piece | null {
        return this.allPieces.find(piece => piece.x === x && piece.y === y && piece.isActive);
    }

}

export class Player {
    public index: number;
    public pieces: Piece[] = [];
    public state: GameState;
    public earnedExtraTurn: boolean = false;

    constructor(state: GameState) {
        this.state = state;
    }

    public get activePieces(): Piece[] {
        return this.pieces.filter(p => p.isActive);
    }

    get setup(): PlayerSetup {
        return this.state.setup.players[this.index];
    }

    get isActive(): boolean {
        return this.state.activePlayerIndex == this.index;
    }
}

export class Piece {
    public state: GameState;
    public player: Player;
    public index: number;
    public isChosen: boolean;
    public isActive: boolean;
    public x: number;
    public y: number;

    constructor(player: Player, index: number, isChosen: boolean, x: number = 0, y: number = 0) {
        this.state = player.state;
        this.player = player;
        this.index = index;
        this.isChosen = isChosen;
        this.x = x;
        this.y = y;
        this.isActive = true;
    }

    public getPossibleMoves(maxDepth: number = 2): Coordinate[] {
        let allMoves = this.getPossibleMovesWithDice(new Coordinate(this.x, this.y), this.player.state.activeDice, maxDepth);
        return allMoves.filter(move => move.x != this.x || move.y != this.y);
    }

    private getPossibleMovesWithDice(fromCoord: Coordinate, dicePool: Die[], maxDepth: number): Coordinate[] {
        let allMoves: Coordinate[] = [];

        for (let die of dicePool) {
            const dieValue = die.value;
            let moves: Coordinate[] = [];
            // Remove die from dice
            let diceRemaining = dicePool.filter(d => d != die);

            [dieValue, 0 - dieValue].forEach(delta => {
                // Apply this die value to the current coordinate 
                moves.push(new Coordinate(fromCoord.x + delta, fromCoord.y, fromCoord.delta + die.value));
                moves.push(new Coordinate(fromCoord.x, fromCoord.y + delta, fromCoord.delta + die.value));
                // If we're a chosen one, then we can move diagonally
                if (this.isChosen) {
                    moves.push(new Coordinate(fromCoord.x + delta, fromCoord.y + delta, fromCoord.delta + die.value));
                    moves.push(new Coordinate(fromCoord.x + delta, fromCoord.y - delta, fromCoord.delta + die.value));
                }
            });

            // Filter out moves that are out of bounds
            moves = moves.filter(move =>
                move.x >= 0 && move.x < this.state.setup.boardWidth &&
                move.y >= 0 && move.y < this.state.setup.boardHeight
            );

            // Filter out squares occupied by our own players' pieces
            let occupedSquares = this.player.activePieces.map(p => new Coordinate(p.x, p.y));
            moves = moves.filter(move =>
                !occupedSquares.some(occupied => occupied.x == move.x && occupied.y == move.y));

            allMoves = allMoves.concat(moves);
            if (diceRemaining.length > 0 && maxDepth > 0) {
                moves.forEach(move => {
                    allMoves = allMoves.concat(this.getPossibleMovesWithDice(move, diceRemaining, maxDepth - 1));
                });
            }

        }

        // Filter all moves to be within the board, and don't allow duplicate entries
        let validMoves = [];
        allMoves.forEach(move => {
            if (move.x >= 0 && move.x < this.player.state.setup.boardWidth &&
                move.y >= 0 && move.y < this.player.state.setup.boardHeight) {
                let index = validMoves.findIndex(m => m.x == move.x && m.y == move.y);
                if (index == -1) {
                    validMoves.push(move);
                }
            }
        });

        console.log(`Found total valid moves: ${validMoves.length}`);

        return validMoves;
    }
}

export class Die {
    state: GameState;
    value: number;
    active: boolean;

    constructor(state: GameState, value: number, active: boolean = true) {
        this.state = state;
        this.value = value;
        this.active = active;
    }
    public roll() {
        // Set random values for this die
        this.value = Math.floor(Math.random() * 6) + 1;
        this.active = true;
    }
}