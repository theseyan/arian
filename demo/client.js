const WebSocket = require('websocket').w3cwebsocket;
const { ArianClient } = require('../index');

// Websocket connection URL
const URL1 = 'http://localhost:3000?token=token1&customdata=loremipsum';
const URL2 = 'http://localhost:3001?token=token2';

// Create a WebSocket and ArianClient instances
var client1 = new ArianClient(new WebSocket(URL1));
var client2 = new ArianClient(new WebSocket(URL2));

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