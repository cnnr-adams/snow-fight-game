console.log("ah");

var socket = io(window.location.href);
socket.on('connect', function () { console.log("Connected") });
socket.on('disconnect', function () { console.log("Disconnected") });
const updateRate = 30;

var config = {
    type: Phaser.CANVAS,
    backgroundColor: (0x000000),
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

const tileSize = 16;

var game = new Phaser.Game(config);

var camera;
var cursors;
var spawnPos;
var player;
var playerSprite;
var phaserThis;

function preload() {
    this.load.image('tile_sheet', 'resources/tile_sheet.png');
    this.load.image('dude', 'resources/dude.png');
    this.load.image('empty16', 'resources/empty16.png');
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
        var d = new Date();
        var thisPlayer = otherPlayers.get(id);
        if (thisPlayer) {
            thisPlayer.targetX = x;
            thisPlayer.targetY = y;
            thisPlayer.lastTime = thisPlayer.currentTime;
            thisPlayer.currentTime = d.getTime();
        } else {
            console.log(`new player @ ${x},${y}`)
            otherPlayers.set(id, { targetX: x, targetY: y, lastTime: d.getTime(), currentTime: d.getTime(), image: phaserThis.add.image(x, y, 'dude') })
        }
    });
    socket.on('playerleave', function (id) {
        const otherPlayer = otherPlayers.get(id);
        if (player) {
            console.log("player deleted.");
            otherPlayer.image.destroy();
            otherPlayers.delete(id);
        }
    });
}
var interpSpeed;
var timeSinceUpdate = 0;
function update(time, delta) {
    //Multiplayer interpolation
    otherPlayers.forEach(otherPlayer => {
        const updateTime = otherPlayer.currentTime - otherPlayer.lastTime;
        if (updateTime / delta !== 0) {
            otherPlayer.image.x = otherPlayer.image.x + (otherPlayer.targetX - otherPlayer.image.x) / (updateTime / delta);
            otherPlayer.image.y = otherPlayer.image.y + (otherPlayer.targetY - otherPlayer.image.y) / (updateTime / delta);
        }
    })
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
                    nearestXWall = Math.floor(currentX / 8) * 8;
                    nearestYWall = Math.ceil(currentY / 8) * 8;
                    nearestXWall -= nearestXWall === currentX ? 8 : 0;
                    nearestYWall += nearestYWall === currentY ? 8 : 0;

                    xM = -1;
                    xS = -0.001;
                } else if (rayAngle >= Math.PI / 2 && rayAngle < Math.PI) {
                    //x to right, y up
                    nearestXWall = Math.ceil(currentX / 8) * 8;
                    nearestYWall = Math.floor(currentY / 8) * 8;
                    nearestXWall += nearestXWall === currentX ? 8 : 0;
                    nearestYWall -= nearestYWall === currentY ? 8 : 0;
                    yM = -1;
                    yS = -0.001;
                } else if (rayAngle >= 0 && rayAngle < Math.PI / 2) {
                    //x to left, y up
                    nearestXWall = Math.floor(currentX / 8) * 8;
                    nearestYWall = Math.floor(currentY / 8) * 8;
                    nearestXWall -= nearestXWall === currentX ? 8 : 0;
                    nearestYWall -= nearestYWall === currentY ? 8 : 0;
                    xM = -1;
                    yM = -1;
                    xS = -0.001;
                    yS = -0.001;
                } else {
                    //x to right, y down
                    nearestXWall = Math.ceil(currentX / 8) * 8;
                    nearestYWall = Math.ceil(currentY / 8) * 8;
                    nearestXWall += nearestXWall === currentX ? 8 : 0;
                    nearestYWall += nearestYWall === currentY ? 8 : 0;
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
                if (wallSet.has(`${Math.round((currentX + xS) / tileSize)}-${Math.round((currentY + yS) / tileSize)}`)) {
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

//canvas for image export
var canvas = document.getElementById('gen_canvas'),
    context = canvas.getContext('2d');

async function renderMap(map) {
    canvas.width = map.length * tileSize;
    canvas.height = map.length * tileSize;
    console.log(map);
    //var tileMap = phaserThis.make.tilemap({ data: map, tileWidth: tileSize, tileHeight: tileSize });
    //var tileSet = tileMap.addTilesetImage('tile_sheet');
    //var layer = tileMap.createDynamicLayer(0, tileSet, -8, -8);
    //collision for player
    //layer.setCollision(2);

    var tiles = [];
    //Wait for load
    console.log("Generating tilemap canvas...");
    map.forEach((arr, y) => {
        arr.forEach((item, x) => {
            if (item === 0) {
                //add to canvas
                tilee = new Image();
                tilee.src = 'resources/tile_empty.png';
                tilee.onload = function () {
                    context.drawImage(tilee, x * tileSize, y * tileSize);
                }
            }
            else if (item === 1) {
                //add to canvas
                tile = new Image();
                tile.src = 'resources/tile.png';
                tile.onload = function () {
                    context.drawImage(tile, x * tileSize, y * tileSize);
                }
            }
            else if (item === 2) {
                //add to canvas
                tilew = new Image();
                tilew.src = 'resources/wall.png';
                tilew.onload = function () {
                    context.drawImage(tilew, x * tileSize, y * tileSize);
                }
                var tile = walls.create(x * 16, y * 16, 'empty16');
                tiles.push(tile);
                //define loaction of walls
                wallSet.add(`${x}-${y}`);
            }
        });
    });
    maskGraphics = phaserThis.add.graphics({ lineStyle: { width: 0.5, color: 0xaa00aa } });
    maskGraphics.alpha = 0.2;
    //oof ouch my testing
    await sleep(500);
    var tilemapURI = canvas.toDataURL();
    console.log(tilemapURI);
    phaserThis.textures.addBase64('tilemap', tilemapURI);
    phaserThis.textures.on('onload', function () {
        var tilemap = phaserThis.add.image(0, 0, 'tilemap')
        tilemap.setOrigin(0, 0);
        tilemap.x = -8;
        tilemap.y = -8;
        tilemap.depth = -2048;
        tilemap.setMask(new Phaser.Display.Masks.GeometryMask(phaserThis, maskGraphics));
    });
    //tiles.forEach(tile => {
    //     tile.setMask(new Phaser.Display.Masks.GeometryMask(phaserThis, maskGraphics));
    //});
    //create the collison link
    phaserThis.physics.add.collider(player, walls);
    do {
        var y = Math.floor(Math.random() * map.length);
        var x = Math.floor(Math.random() * map[y].length);
        spawnPos = { x: x, y: y };
    } while (map[y][x] !== 1);
    player.x = (spawnPos.x * tileSize)
    player.y = (spawnPos.y * tileSize)

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}