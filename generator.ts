enum Direction {
    North = 1,
    East = 2,
    South = 3,
    West = 4
}

export default class Generator {
    private floorPositions = new Array<Position>();
    private sober = false;
    public tilemapImage;
    constructor(private width: number, private height: number,
        private percentFill: number, private tunnelPercent: number) { }

    generate() {
        this.floorPositions = new Array<Position>();
        let clearedTiles = 10;
        const sz = this.width * this.height;
        const p = this.percentFill / 100.0;
        const requiredTiles = Math.round(sz * p);
        const maxSteps = requiredTiles * 10;
        let location = this.getRandomCenter(5);
        let direction = this.turn(location, -1);
        let steps = this.think(-1, location, direction);
        let panicSteps = 0;
        while (clearedTiles < requiredTiles) {
            if (!this.contains(location)) {
                this.floorPositions.push(new Position(location.x, location.y));
            }
            clearedTiles++;

            steps = this.think(steps, location, direction);

            if (this.sober) {
                if (this.getEdgeDirection(location) != -1) this.sober = false;
            }
            if (!this.sober) {
                direction = this.turn(location, direction);
            }

            location = this.move(location, direction);

            if (location.x < 1) location.x++;
            else if (location.x >= this.width - 1) location.x--;

            if (location.y < 1) location.y++;
            else if (location.y >= this.height - 1) location.y--;

            panicSteps++;
            if (panicSteps > maxSteps) {
                console.error("Panic exit on mapgen!");
                break;
            }
        }
        this.postScriptWalls();
        return this.floorPositions;
    }

    private move(location: Position, direction: Direction): Position {
        switch (direction) {
            case Direction.North: location.y -= 1; break;
            case Direction.South: location.y += 1; break;
            case Direction.East: location.x += 1; break;
            case Direction.West: location.x -= 1; break;
        }
        return location;
    }

    private turn(location: Position, direction: Direction): Direction {
        let newDir;
        do {
            newDir = this.getRandomDirection();
        } while (newDir === direction);
        const sd = this.getEdgeDirection(location);
        if (sd != -1 && this.flipCoin()) newDir = sd;
        return newDir;
    }

    private think(steps: number, location: Position, direction: Direction): number {
        if (steps <= 0) {
            if (this.soberUp(location, direction) && this.sometimes()) {
                this.sober = true;
                steps = this.getRandomInt(5, 10);
            } else {
                this.sober = false;
                steps = this.getRandomInt(20, 30);
            }
        } else {
            steps--;
        }
        return steps;
    }

    private soberUp(location: Position, direction: Direction) {
        if (this.getEdgeDirection(location) != -1) return false;

        const r = new Rectangle(location.x - 4, location.y - 4, 9, 9);

        switch (direction) {
            case Direction.North: r.y -= 4; break;
            case Direction.South: r.y += 4; break;
            case Direction.West: r.x -= 4; break;
            case Direction.East: r.x += 4; break;
            default: break;
        }
        const minAmount = Math.round(r.getSize() / 4);
        let a = 0;

        const c = new Position(r.x, r.y);
        for (; c.y <= r.y + r.height; c.y++) {
            for (; c.x <= r.x + r.width; c.x++) {
                if (!this.inMap(c)) return false;
                if (this.contains(c)) a++;
                if (a > minAmount) return false;
            }
        }
        return true;
    }

    private contains(c: Position) {
        return this.floorPositions.some((position: Position) => {
            if (position.x === c.x && position.y === c.y) {
                return true;
            }
            return false;
        });
    }
    private get(c: Position): Position {
        let tile: Position;
        this.floorPositions.some((position: Position) => {
            if (position.x === c.x && position.y === c.y) {
                tile = position;
                return true;
            }
            return false;
        });
        return tile;
    }
    private getEdgeDirection(location: Position) {
        const edgeSize = 5;
        let sd = -1;
        if (location.y < edgeSize) sd = Direction.South;
        else if (location.y > this.height - edgeSize) sd = Direction.North;

        if (location.x < edgeSize) sd = Direction.East;
        if (location.x > this.width - edgeSize) sd = Direction.West;

        return sd;
    }

    private getRandomDirection(): Direction {
        return this.getRandomInt(1, 4);
    }
    private getRandomCenter(distance: number): Position {
        return new Position(
            Math.round(this.width / 2.0) + this.getRandomInt(-distance, distance),
            Math.round(this.height / 2.0) + this.getRandomInt(-distance, distance));
    }

    private getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    private flipCoin(): boolean {
        return Math.random() > 0.5;
    }
    private inMap(c: Position): boolean {
        return (c.x < this.width && c.x > 0 && c.y < this.height && c.y > 0);
    }
    private sometimes() {
        return Math.random() < (this.tunnelPercent / 100.0)
    }
    private postScriptWalls() {
        this.floorPositions.forEach((pos) => {
            if (pos.type === 'floor') {
                const up = new Position(pos.x, pos.y + 1, 'wall');
                const down = new Position(pos.x, pos.y - 1, 'wall');
                const left = new Position(pos.x - 1, pos.y, 'wall');
                const right = new Position(pos.x + 1, pos.y, 'wall');
                const upLeft = new Position(pos.x - 1, pos.y - 1, 'wall');
                const upRight = new Position(pos.x + 1, pos.y - 1, 'wall');
                const downLeft = new Position(pos.x - 1, pos.y + 1, 'wall');
                const downRight = new Position(pos.x + 1, pos.y + 1, 'wall');
                if (!this.contains(up)) {
                    this.floorPositions.push(up);
                }
                if (!this.contains(down)) {
                    this.floorPositions.push(down);
                }
                if (!this.contains(left)) {
                    this.floorPositions.push(left);
                }
                if (!this.contains(right)) {
                    this.floorPositions.push(right);
                }
                if (!this.contains(upLeft)) {
                    this.floorPositions.push(upLeft);
                }
                if (!this.contains(upRight)) {
                    this.floorPositions.push(upRight);
                }
                if (!this.contains(downLeft)) {
                    this.floorPositions.push(downLeft);
                }
                if (!this.contains(downRight)) {
                    this.floorPositions.push(downRight);
                }
            }
        });
    }
    createMap(): Array<Array<number>> {
        const arr: Array<Array<number>> = new Array();
        for (let x = 0; x < this.width; x++) {
            const innerArr = new Array();
            for (let y = 0; y < this.height; y++) {
                const tile = this.get(new Position(x, y));
                if (tile) {
                    if (tile.type === 'floor') {
                        innerArr.push(1);
                    } else if (tile.type === 'wall') {
                        innerArr.push(2);
                    }
                } else {
                    innerArr.push(0);
                }
            }
            arr.push(innerArr);
        }
        return arr;
    }
    createTilemap(map) {
        const tileSize = 16;
        const Canvas = require('canvas-prebuilt');
        const Image = Canvas.Image;
        const canvas = new Canvas(map.length * tileSize, map.length * tileSize);
        const context = canvas.getContext('2d'/*, { preserveDrawingBuffer: true }*/);

        var tilee = new Image();
        var tile = new Image();
        var tilew = new Image();

        //chain load tile images.
        tilee.onload = function () {
            tile.onload = function () {
                tilew.onload = function () {

                    map.forEach((arr, y) => {
                        arr.forEach((item, x) => {
                            if (item === 0) {
                                //add to canvas
                                //tilee.onload = function () {
                                context.drawImage(tilee, x * tileSize, y * tileSize);
                                //}
                            }
                            else if (item === 1) {
                                //add to canvas
                                //tile.onload = function () {
                                context.drawImage(tile, x * tileSize, y * tileSize);
                                //}
                            }
                            else if (item === 2) {
                                //add to canvas
                                //tilew.onload = function () {
                                context.drawImage(tilew, x * tileSize, y * tileSize);
                                //}
                            }
                        });
                    });
                }
            }
        }
        tilee.src = 'public/resources/tile_empty.png';
        tile.src = 'public/resources/tile.png';
        tilew.src = 'public/resources/wall.png';

        var tilemap = canvas.toDataURL();
        console.log('Generating tilemap image!');
        return tilemap;

    }
}

class Position {
    constructor(public x: number, public y: number, public type = 'floor') { }
}

class Rectangle {
    constructor(public x: number, public y: number, public width: number, public height: number) { }
    getSize(): number {
        return this.width * this.height;
    }
}