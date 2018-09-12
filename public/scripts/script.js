console.log("ah");

var socket = io('http://localhost:3200');
socket.on('connect', function () { console.log("Big gay connect") });
socket.on('event', function (data) { });
socket.on('disconnect', function () { console.log("Big disconnect") });
