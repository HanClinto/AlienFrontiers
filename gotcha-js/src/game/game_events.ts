import { createEventDefinition } from "ts-bus";
import { PieceSprite } from "../scenes/game/piece-sprite";
import { Coordinate } from "./coordinate";
import { Die, GameAction, Piece, Player } from "./game_state";

export const waitingForAction = createEventDefinition<{
    action: GameAction;
}>()("waiting.for.action");

export const diceRolled = createEventDefinition<{
    dice: Die[];
}>()("dice.rolled");

export const pieceSpriteSelected = createEventDefinition<{
    pieceSprite: PieceSprite;
}>()("piece.selected");



export const doDiceRoll = createEventDefinition<{
}>()("do.dice.roll");

export const doPieceMove = createEventDefinition<{
    piece: Piece;
    to: Coordinate;
}>()("do.piece.move");

export const doPieceSelect = createEventDefinition<{
    piece: Piece;
}>()("do.piece.select");

export const dieUsed = createEventDefinition<{
    die: Die;
}>()("die.used");


export const pieceMoved = createEventDefinition<{
    piece: Piece;
}>()("piece.moved");

export const pieceCaptured = createEventDefinition<{
    capturingPiece: Piece;
    capturedPiece: Piece;
}>()("piece.captured");

export const playerNext = createEventDefinition<{
}>()("player.next");

export const gameEnded = createEventDefinition<{
    winner: Player;
}>()("game.ended");