console.log("ah");

var socket = io('http://localhost:3200');
socket.on('connect', function () { console.log("Big gay connect") });
socket.on('player', function (id, x, y, rot) { console.log(id, x, y, rot); });
socket.emit('player', 2, 3, 5);
socket.emit('map', renderMap);
socket.on('disconnect', function () { console.log("Big disconnect") });


var app = new PIXI.Application(800, 600, { backgroundColor: 0x303030 });

document.body.appendChild(app.view);

var stage = new PIXI.Stage(0xFFFFFF);
/*
var graphics = new PIXI.Graphics();
graphics.beginFill(0xFFFF00);
// set the line style to have a width of 5 and set the color to red
graphics.lineStyle(5, 0xFF0000);
*/

function renderMap(map) {
    const rectangle = new PIXI.Graphics();
    rectangle.beginFill(0);
    //set the rectangle to the center
    rectangle.position.x = app.screen.width / 2;
    rectangle.position.y = app.screen.height / 2;
    rectangle.drawRoundedRect(
        0,
        0,
        100,
        100,
        5,
    );
    rectangle.endFill();
    stage.addChild(rectangle);

    /*
    map.forEach(item => {
        graphics.drawRect(item.x, item.y, 1, 1);
        stage.addChild(graphics);
        console.log(stage);
    });*/

}




/*
// Add the 'keydown' event listener to our document
document.addEventListener('keydown', onKey);
var boxWidth = 5;

// center the sprite's anchor point
dude.anchor.set(0.5);

// move the sprite to the center of the screen
dude.x = app.screen.width / 2;
dude.y = app.screen.height / 2;

app.stage.addChild(dude);

// Listen for animate update
app.ticker.add(function (delta) {
});

function onKey(key) {
    var dirX = 0;
    var dirY = 0;
    // UP
    if (key.keyCode === 38 || key.keyCode === 87) {
        dirY -= 10;
    }

    // DOWN
    if (key.keyCode === 83 || key.keyCode === 40) {
        dirY += 10;
    }

    // LEFT
    if (key.keyCode === 37 || key.keyCode === 65) {
        dirX -= 10;
    }

    // DOWN
    if (key.keyCode === 39 || key.keyCode === 68) {
        dirX += 10;
    }
    dude.position.x += dirX;
    dude.position.y += dirY;
}*/