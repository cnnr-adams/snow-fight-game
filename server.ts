const port = process.env.PORT || 3200;

import * as express from 'express';
const app = express();
import * as http from 'http';
const server = new http.Server(app);
import * as socketio from 'socket.io';
const io = socketio(server);

import Generator from './generator';
console.log("Generating map...");
const generator = new Generator(15, 15, 20, 20);
generator.generate();
console.log("Map generated, generating simple tilemap..");
const map = generator.createTileMap();

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
    socket.on('player', (x, y, rot) => {
        socket.broadcast.emit('player', socket.id, x, y, rot);
    });
    socket.on('map', (callback) => {
        callback(map);
    });
    socket.on('disconnect', function () {
        socket.broadcast.emit('playerleave', socket.id);
    });
});