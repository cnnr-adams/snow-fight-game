const port = process.env.PORT || 3200;

import * as express from 'express';
const app = express();
import * as http from 'http';
const server = new http.Server(app);
import * as socketio from 'socket.io';
const io = socketio(server);

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
});