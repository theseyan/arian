const WebSocket = require('websocket').w3cwebsocket;
const { ArianClient } = require('../index');
const URL = 'http://localhost:3000';

var ws = new WebSocket(URL);
var client = new ArianClient(ws, URL);

client.events.on('error', (e) => {
    
});