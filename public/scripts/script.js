console.log("ah");

var socket = io('http://localhost:3200');
socket.on('connect', function () { console.log("Connected") });
socket.on('disconnect', function () { console.log("Disconnected") });
const updateRate = 30;

var config = {
    type: Phaser.AUTO,
    pixelArt: true,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var camera;
var cursors;
var spawnPos;
var player;
var playerSprite;
var phaserThis;

function preload() {
    this.load.image('tile_sheet', 'resources/tile_sheet.png');
    this.load.image('tile', 'resources/tile.png');
    this.load.image('dude', 'resources/dude.png');
    this.load.image('wall', 'resources/wall.png');
    this.load.image('playercollision', 'resources/playercollision.png');
}
var lightAngle = Math.PI / 4;
var numberOfRays = 100;
var rayLength = 100;
var otherPlayers = new Map();
function create() {
    console.log("CREATE!");
    phaserThis = this;

    camera = this.cameras.main;
    camera.setZoom(5);
    walls = this.physics.add.staticGroup();
    player = this.physics.add.sprite(0, 0, 'playercollision');
    playerSprite = this.add.image(0, 0, 'dude');
    cursors = this.input.keyboard.createCursorKeys();

    socket.emit('map', renderMap);
    socket.on('player', function (id, x, y, rot) {
        var thisPlayer = otherPlayers.get(id);
        if (thisPlayer) {
            thisPlayer.x = x;
            thisPlayer.y = y;
        } else {
            otherPlayers.set(id, phaserThis.add.image(x, y, 'dude'))
        }
    });
    socket.on('playerleave', function (id) {
        const player = otherPlayers.get(id);
        if (player) {
            player.texture.destroy();
            otherPlayers.delete(id);
        }
    });
}

var timeSinceUpdate = 0;
function update(time, delta) {
    if (cursors.up.isDown) {
        player.setVelocityY(-160);
    }
    else if (cursors.down.isDown) {
        player.setVelocityY(160);
    } else {
        player.setVelocityY(0);
    }
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    camera.scrollX = player.x - window.innerWidth / 2;
    camera.scrollY = player.y - window.innerHeight / 2;

    playerSprite.x = player.x;
    playerSprite.y = player.y;

    playerSprite.depth = playerSprite.y;
    timeSinceUpdate += delta;
    if (timeSinceUpdate > updateRate) {
        timeSinceUpdate = 0;
        socket.emit('player', player.x, player.y, 0);
    }

    if (wallSet !== undefined && maskGraphics) {
        maskGraphics.clear();

        // For polygon drawing purposes
        var points = [player.x, player.y];

        // Angle, in radians, of the mouse to the player
        var mouseAngle = Math.atan2(player.y - (game.input.mousePointer.y + this.cameras.main.scrollY), player.x - (game.input.mousePointer.x + this.cameras.main.scrollX));

        // Multiple rays for flashlight effect
        for (var i = 0; i < numberOfRays; i++) {

            // Angle, in radians, of the ray created
            var rayAngle = mouseAngle - (lightAngle / 2) + (lightAngle / numberOfRays) * i;
            rayAngle += rayAngle < -Math.PI ? 2 * Math.PI : 0;

            // Distance y goes for each x and vice versa
            const yRatio = Math.tan(rayAngle);
            const xRatio = 1 / yRatio;

            // Current ray position, starts at player(can be hand or w/e as well)
            let currentX = player.x;
            let currentY = player.y;

            // Current distance the ray has traveled
            let currentDistance = 0;

            // Until the length is too long
            while (currentDistance < rayLength) {
                let nearestXWall;
                let nearestYWall;
                let xDistance;
                let yDistance;

                // Multiplier for direction of travel
                let yM = 1;
                let xM = 1;
                // Shift to round to different tile
                let xS = 0;
                let yS = 0;

                // Quadrants need to act differently
                if (rayAngle >= -Math.PI / 2 && rayAngle < 0) {
                    //x to left, y down
                    nearestXWall = Math.floor(currentX / 16) * 16;
                    nearestYWall = Math.ceil(currentY / 16) * 16;
                    nearestXWall -= nearestXWall === currentX ? 16 : 0;
                    nearestYWall += nearestYWall === currentY ? 16 : 0;

                    xM = -1;
                    xS = -1;
                } else if (rayAngle >= Math.PI / 2 && rayAngle < Math.PI) {
                    //x to right, y up
                    nearestXWall = Math.ceil(currentX / 16) * 16;
                    nearestYWall = Math.floor(currentY / 16) * 16;
                    nearestXWall += nearestXWall === currentX ? 16 : 0;
                    nearestYWall -= nearestYWall === currentY ? 16 : 0;
                    yM = -1;
                    yS = -1;
                } else if (rayAngle >= 0 && rayAngle < Math.PI / 2) {
                    //x to left, y up
                    nearestXWall = Math.floor(currentX / 16) * 16;
                    nearestYWall = Math.floor(currentY / 16) * 16;
                    nearestXWall -= nearestXWall === currentX ? 16 : 0;
                    nearestYWall -= nearestYWall === currentY ? 16 : 0;
                    xM = -1;
                    yM = -1;
                    xS = -1;
                    yS = -1;
                } else {
                    //x to right, y down
                    nearestXWall = Math.ceil(currentX / 16) * 16;
                    nearestYWall = Math.ceil(currentY / 16) * 16;
                    nearestXWall += nearestXWall === currentX ? 16 : 0;
                    nearestYWall += nearestYWall === currentY ? 16 : 0;
                }

                // Distance to y edge vs x edge
                xDistance = Math.abs(currentX - nearestXWall);
                yDistance = Math.abs(currentY - nearestYWall);

                // Puts the Y distance in terms of x to compare which one is bigger/takes longer
                if (Math.abs((xDistance)) <= Math.abs((yDistance * xRatio))) {
                    currentX = nearestXWall;
                    currentY += xDistance * yRatio * xM;
                } else {
                    currentY = nearestYWall;
                    currentX += yDistance * xRatio * yM;
                }
                currentDistance = Math.hypot(currentX - player.x, currentY - player.y);
                if (wallSet.has(`${Math.floor((currentX + xS) / 16)}-${Math.floor((currentY + yS) / 16)}`)) {
                    if (currentDistance > rayLength) {
                        //hypot: raylength, close = hcos(theta), far = hsin(theta)
                        currentX = player.x - rayLength * Math.cos(rayAngle);
                        currentY = player.y - rayLength * Math.sin(rayAngle);
                    }
                    break;
                }
                if (currentDistance > rayLength) {
                    //hypot: raylength, close = hcos(theta), far = hsin(theta)
                    currentX = player.x - rayLength * Math.cos(rayAngle);
                    currentY = player.y - rayLength * Math.sin(rayAngle);
                }
            }
            points.push(currentX, currentY);
        }

        // Creates the flashlight polygon
        var polygon = new Phaser.Geom.Polygon(points);
        maskGraphics.fillStyle(0xffffe0);
        maskGraphics.fillPoints(polygon.points, true);
    }
}

function toDegrees(angle) {
    return angle * (180 / Math.PI);
}
function toRadians(angle) {
    return angle * (Math.PI / 180);
}

var maskGraphics;
var wallSet = new Set();
function renderMap(map) {
    var tileMap = this.make.tilemap({ data: level, tileWidth: 16, tileHeight: 16, });

    var tiles = [];
    //Wait for load
    map.forEach(item => {
        if (item.type === 'floor') {
            var tile = phaserThis.add.image(item.x * 16, item.y * 16, 'tile');
            tile.setOrigin(0, 0)
            tiles.push(tile);

        } else if (item.type === 'wall') {
            var tile = walls.create(item.x * 16, item.y * 16, 'wall');
            tile.setOrigin(0, 0)
            tiles.push(tile);
            wallSet.add(`${item.x}-${item.y}`);
        }

    });
    maskGraphics = phaserThis.add.graphics({ lineStyle: { width: 0.5, color: 0xaa00aa } });
    maskGraphics.alpha = 0.8;
    tiles.forEach(tile => {
        tile.setMask(new Phaser.Display.Masks.GeometryMask(phaserThis, maskGraphics));
    });
    //create the collison link
    phaserThis.physics.add.collider(player, walls);
    do {
        spawnPos = map[Math.floor(Math.random() * map.length)];
    } while (spawnPos.type === 'wall');

    player.x = (spawnPos.x * 16)
    player.y = (spawnPos.y * 16)

}