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
        create: create
    }
};

var game = new Phaser.Game(config);

function preload() {
    this.load.image('tinytile', 'resources/tinytile.png');
}

function create() {
    console.log("gayt");
}

function renderMap(map) {
    console.log(map);
    map.forEach(item => {
        var tile = this.add.image('tinytile');
        tile.position.x = item.x;
        tile.position.y = item.y;
    });

}