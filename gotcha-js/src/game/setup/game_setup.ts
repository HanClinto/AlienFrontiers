export enum PlayerType {
    HUMAN,
    AI,
}

export class GameSetup {
    public boardWidth: number = 13;
    public boardHeight: number = 13;
    public players: PlayerSetup[] = [
        new PlayerSetup(PlayerType.HUMAN, "Player 1", "checkers",
            4, 1,
            13, 1),
        new PlayerSetup(PlayerType.AI, "Player 2", "checkers",
            5, 2,
            13, 1),
    ];

    public option_CaptureFriendlyPieces: boolean = false;
}

export class PlayerSetup {
    public type: PlayerType;
    public name: string;
    public spriteKey: string;
    public spriteFrame: number;
    public spriteFrameChosen: number;
    public numPieces: number;
    public numChosenPieces: number;

    constructor(type: PlayerType, name: string, sprite: string, spriteFrame: number, spriteFrameChosen: number, numPieces: number, numChosenPieces: number) {
        this.type = type;
        this.name = name;
        this.spriteKey = sprite;
        this.spriteFrame = spriteFrame;
        this.spriteFrameChosen = spriteFrameChosen;
        this.numPieces = numPieces;
        this.numChosenPieces = numChosenPieces;
    }
}
