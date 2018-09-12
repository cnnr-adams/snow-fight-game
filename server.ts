const port = process.env.PORT || 3200;

import * as express from 'express';
const app = express();
import * as http from 'http';
const server = new http.Server(app);
import * as socketio from 'socket.io';
const io = socketio(server);

import Generator from './generator';
const generator = new Generator(100, 100, 20, 10);
const map = generator.generate();

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
    socket.on('player', (x, y, rot) => {
        socket.broadcast.emit('player', x, y, rot);
    });
    socket.on('map', (callback) => {
        callback(map);
    });
});