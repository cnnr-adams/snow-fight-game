console.log("ah");

var socket = io('http://localhost:3200');
socket.on('connect', function () { console.log("Connected") });
socket.on('disconnect', function () { console.log("Disconnected") });
const updateRate = 30;

var config = {
    type: Phaser.AUTO,
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
    this.load.image('tile', 'resources/tile.png');
    this.load.image('dude', 'resources/dude.png');
    this.load.image('wall', 'resources/wall.png');
    this.load.image('playercollision', 'resources/playercollision.png');
}
var lightAngle = Math.PI / 4;
var numberOfRays = 50;
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
        var points = [player.x, player.y];
        var mouseAngle = Math.atan2(player.y - (game.input.mousePointer.y + this.cameras.main.scrollY), player.x - (game.input.mousePointer.x + this.cameras.main.scrollX));
        for (var i = 0; i < numberOfRays; i++) {
            var ray = (180 - toDegrees(mouseAngle - (lightAngle / 2) + (lightAngle / numberOfRays) * i));
            var rayAngle = ray < 0 ? 360 + ray : ray;
            const yRatio = Math.tan(toRadians(rayAngle));
            const xRatio = 1 / yRatio;
            let currentX = player.x;
            let currentY = player.y;
            let currentDistance = 0;
            while (currentDistance < rayLength) {
                let nearestXWall;
                let nearestYWall;
                if (rayAngle >= 0 && rayAngle < 90) {
                    //  console.log("0", currentX, Math.ceil(currentX / 16) * 16);
                    //x to right, y up
                    nearestXWall = Math.ceil(currentX / 16) * 16;
                    nearestYWall = Math.floor(currentY / 16) * 16;
                    nearestXWall += nearestXWall === currentX ? 16 : 0;
                    nearestYWall -= nearestYWall === currentY ? 16 : 0;
                } else if (rayAngle >= 90 && rayAngle < 180) {
                    //     console.log("90", currentX, Math.floor(currentX / 16) * 16);
                    //x to left, y up
                    nearestXWall = Math.floor(currentX / 16) * 16;
                    nearestYWall = Math.floor(currentY / 16) * 16;
                    nearestXWall -= nearestXWall === currentX ? 16 : 0;
                    nearestYWall -= nearestYWall === currentY ? 16 : 0;
                } else if (rayAngle >= 180 && rayAngle < 270) {
                    // console.log("180", currentX, Math.floor(currentX / 16) * 16);
                    //x to left, y down
                    nearestXWall = Math.floor(currentX / 16) * 16;
                    nearestYWall = Math.ceil(currentY / 16) * 16;
                    nearestXWall -= nearestXWall === currentX ? 16 : 0;
                    nearestYWall += nearestYWall === currentY ? 16 : 0;
                } else {
                    // console.log("270", currentX, Math.ceil(currentX / 16) * 16);
                    //x to right, y down
                    nearestXWall = Math.ceil(currentX / 16) * 16;
                    nearestYWall = Math.ceil(currentY / 16) * 16;
                    nearestXWall += nearestXWall === currentX ? 16 : 0;
                    nearestYWall += nearestYWall === currentY ? 16 : 0;
                }

                const xDistance = Math.abs(currentX - nearestXWall);
                const yDistance = Math.abs(currentY - nearestYWall);

                // Essentially calculates inverse time each would take to REACH ((((((((I think))))))))
                if ((xRatio / xDistance) >= (yRatio / yDistance)) {
                    currentX = nearestXWall;
                    currentY += xDistance * yRatio;
                } else {
                    currentY = nearestYWall;
                    currentX += yDistance * xRatio;
                }
                // console.log(xDistance, yDistance, currentX, player.x, currentY, player.y)
                currentDistance = Math.sqrt(Math.pow(currentX - player.x, 2) + Math.pow(currentY - player.y, 2));
                if (currentDistance > rayLength) {
                    //hypot: raylength, close = hcos(theta), far = hsin(theta)
                    currentX = rayLength * toDegrees(Math.cos(toRadians(rayAngle)));
                    currentY = rayLength * toDegrees(Math.sin(toRadians(rayAngle)));
                }
            }
            points.push(currentX, currentY);

            /* var lastX = player.x;
             var lastY = player.y;
             for (var j = 1; j <= rayLength; j += 0.1) {
                 var landingX = player.x - (j) * Math.cos(rayAngle);
                 var landingY = player.y - (j) * Math.sin(rayAngle);
                 if (!wallSet.has(`${Math.round(landingX / 16)}-${Math.round(landingY / 16)}`)) {
                     lastX = landingX;
                     lastY = landingY;
                 }
                 else {
                     //  console.log(lastX, lastY);
                     points.push(lastX, lastY);
                     break;
                 }
             }*/
            // points.push(lastX, lastY);
        }
        // maskGraphics.fillStyle(2, 0xffffff);
        // var circle = new Phaser.Geom.Circle(player.x, player.y, 20);
        // maskGraphics.fillCircleShape(circle, true);
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
    var tiles = [];
    //Wait for load
    map.forEach(item => {
        if (item.type === 'floor') {
            var tile = phaserThis.add.image(item.x * 16, item.y * 16, 'tile');
            tiles.push(tile);

        } else if (item.type === 'wall') {
            var tile = walls.create(item.x * 16, item.y * 16, 'wall');
            tiles.push(tile);
            wallSet.add(`${item.x}-${item.y}`);
        }

    });
    maskGraphics = phaserThis.add.graphics({ fillStyle: { color: 0xffffe0 } });
    maskGraphics.alpha = 0.5;
    tiles.forEach(tile => {
        tile.setMask(new Phaser.Display.Masks.GeometryMask(phaserThis, maskGraphics));
    });
    //create the collison link
    phaserThis.physics.add.collider(player, walls);
    spawnPos = map[Math.floor(Math.random() * map.length)];
    player.x = (spawnPos.x * 16)
    player.y = (spawnPos.y * 16)

}