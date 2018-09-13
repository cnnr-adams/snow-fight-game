console.log("ah");

var socket = io('http://localhost:3200');
socket.on('connect', function () { console.log("Big gay connect") });
socket.on('disconnect', function () { console.log("Big disconnect") });
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
        update: update,
        render: render
    }
};

var game = new Phaser.Game(config);

var camera;
var cursors;
var spawnPos;
var player;

var phaserThis;
function preload() {
    this.load.image('tile', 'resources/tile.png');
    this.load.image('dude', 'resources/dude.png');
    this.load.image('wall', 'resources/wall.png');
}
var otherPlayers = new Map();
function create() {
    console.log("CREATE!");
    phaserThis = this;

    camera = this.cameras.main;
    camera.setZoom(5);
    walls = this.physics.add.staticGroup();
    player = this.physics.add.sprite(0, 0, 'dude');
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

    player.depth = player.y;
    timeSinceUpdate += delta;
    if (timeSinceUpdate > updateRate) {
        timeSinceUpdate = 0;
        socket.emit('player', player.x, player.y, 0);
    }
}

function render() {
    console.log("gay_");
    this.debug.cameraInfo(camera, 32, 32);
}

function renderMap(map) {
    //Wait for load
    while (!phaserThis);
    map.forEach(item => {
        if (item.type === 'floor') {
            var tile = phaserThis.add.image(item.x * 16, item.y * 16, 'tile');
        } else if (item.type === 'wall') {
            var tile = walls.create(item.x * 16, item.y * 16, 'wall');
        }

    });
    //create the collison link
    phaserThis.physics.add.collider(player, walls);
    spawnPos = map[Math.floor(Math.random() * map.length)];
    player.x = (spawnPos.x * 16)
    player.y = (spawnPos.y * 16)
}