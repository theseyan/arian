const WebSocket = require('websocket').w3cwebsocket;
const { ArianClient } = require('../index');

// Websocket connection URL
const URL = 'http://localhost:3000';

// Create a WebSocket and ArianClient instance
var ws = new WebSocket(URL);
var client = new ArianClient(ws, URL);

// Handle message
client.on('message', (data) => {
    console.log(data);
});

// Handle custom event
client.on('customEvent', (data) => {
    console.log(data);

    // Send message to server
    client.send({
        msg: 'generic message from client'
    });

    // Send custom event message to server
    client.send('customClientEvent', {
        msg: 'custom event message from client'
    });
});

// Handle connection opened
client.on('connect', state => {
    console.log('Websocket connected with readyState ' + state);
});

// Handle error
client.on('error', (e) => {
    console.log('Client closed due to error');
});