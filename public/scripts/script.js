console.log("ah");

var socket = io('http://localhost:3200');
socket.on('connect', function () { console.log("Big gay connect") });
socket.on('player', function (id, x, y, rot) { console.log(id, x, y, rot); });
socket.emit('player', 2, 3, 5);
socket.on('disconnect', function () { console.log("Big disconnect") });


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
    this.load.image('wall', 'resources/placeholder.png');
}

function create() {
    console.log("CREATE!");
    phaserThis = this;
    camera = this.cameras.main;

    camera.setZoom(5);
    player = this.add.image(0, 0, 'dude');
    cursors = this.input.keyboard.createCursorKeys();
    socket.emit('map', renderMap);
}

function update() {
    if (cursors.up.isDown) {
        player.y -= 2;
    }
    else if (cursors.down.isDown) {
        player.y += 2;
    }
    if (cursors.left.isDown) {
        player.x -= 2;
    }
    else if (cursors.right.isDown) {
        player.x += 2;
    }

    camera.scrollX = player.x - window.innerWidth / 2;
    camera.scrollY = player.y - window.innerHeight / 2;

    player.depth = player.y;
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
            var tile = phaserThis.add.image(item.x * 16, item.y * 16, 'wall');
        }

    });
    spawnPos = map[Math.floor(Math.random() * map.length)];
    console.log(spawnPos);
    player.x = (spawnPos.x * 16)
    player.y = (spawnPos.y * 16)
}