console.log("ah");

var socket = io('http://localhost:3200');
socket.on('connect', function () { console.log("Big gay connect") });
socket.on('player', function (id, x, y, rot) { console.log(id, x, y, rot); });
socket.emit('player', 2, 3, 5);
socket.emit('map', renderMap);
socket.on('disconnect', function () { console.log("Big disconnect") });


var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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

var phaserThis;
function preload() {
    this.load.image('tile', 'resources/tile.png');
}

function create() {
    phaserThis = this;
    camera = this.cameras.main;

    camera.scrollX = 3500;
    camera.scrollY = 2500;

    camera.setZoom(5);
    cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    if (cursors.up.isDown) {
        camera.scrollY -= 2;
    }
    else if (cursors.down.isDown) {
        camera.scrollY += 2;
    }

    if (cursors.left.isDown) {
        camera.scrollX -= 2;
    }
    else if (cursors.right.isDown) {
        camera.scrollX += 2;
    }
}

function render() {
    console.log("gay_");
    this.debug.cameraInfo(camera, 32, 32);
}

function renderMap(map) {
    console.log(map);
    map.forEach(item => {
        var tile = phaserThis.add.image(item.x * 16, item.y * 16, 'tile');
    });

}