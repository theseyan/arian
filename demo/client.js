const WebSocket = require('websocket').w3cwebsocket;
const { ArianClient } = require('../index');

// Websocket connection URL
const URL1 = 'http://localhost:3000';
const URL2 = 'http://localhost:3001';

// Create a WebSocket and ArianClient instances
var ws1 = new WebSocket(URL1);
var ws2 = new WebSocket(URL2);
var client1 = new ArianClient(ws1, URL1);
var client2 = new ArianClient(ws2, URL2);

// Handle message
client1.on('message', (data) => {
    console.log('[Client1]', data);
});

// Handle custom event
client1.on('customEvent', (data) => {
    console.log('[Client1]customEvent', data);
});

// Handle connection opened
client1.on('connect', state => {
    console.log('Client1 connected with readyState ' + state);
});

// Handle error
client1.on('error', (e) => {
    console.log('Client1 closed due to error');
});

/**
 * CLIENT 2
 * --------
*/

// Handle message
client2.on('message', (data) => {
    console.log('[Client2]', data);
});

// Handle connection opened
client2.on('connect', state => {
    console.log('Client2 connected with readyState ' + state);
});

// Handle error
client2.on('error', (e) => {
    console.log('Client2 closed due to error');
});