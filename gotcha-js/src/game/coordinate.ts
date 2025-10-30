
export class Coordinate {
    public x: integer;
    public y: integer;
    public delta: integer;

    constructor(x: integer = 0, y: integer = 0, delta: number = 0) {
        this.x = x;
        this.y = y;
        this.delta = delta;
    }

    public isEqual(other: Coordinate): boolean {
        return this.x == other.x && this.y == other.y;
    }
}