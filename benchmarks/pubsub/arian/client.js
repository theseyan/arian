const WebSocket = require('websocket').w3cwebsocket;
const { ArianClient } = require('../../../index');

// Websocket connection URL
const URL = 'http://localhost:3000';

/* By default we use 10% active traders, 90% passive watchers */
const numClients = 125;
const tradersFraction = 0.1;

/* 125 * 4 = 500, even though 4 instances cannot stress the server fully */
console.log("RUN 4 INSTANCES OF THIS CLIENT");

let shares = [
	'NFLX',
	'TSLA',
	'AMZN',
	'GOOG',
	'NVDA'
];

function establishConnections(remainingClients) {

	if (!remainingClients) {
		return;
	}

	/* Current value of our share */
	let value;

	let ws = new WebSocket(URL);
    let socket = new ArianClient(ws, URL);

	socket.on('connect', () => {
		/* Randomly select one share this client will be interested in */
		let shareOfInterest = shares[parseInt(Math.random() * shares.length)];

		/* Subscribe to the share we are interested in */
		socket.send({action: 'sub', share: shareOfInterest});

		/* Is this client going to be an active trader, or a passive watcher? */
		if (remainingClients <= numClients * tradersFraction) {
			/* If so, then buy and sell shares every 1ms, driving change in the stock market */
			setInterval(() => {
				/* For simplicity we just randomly buy/sell */
				if (Math.random() < 0.5) {
					socket.send({action: 'buy', share: shareOfInterest});
				} else {
					socket.send({action: 'sell', share: shareOfInterest});
				}
			}, 1);
		}

		establishConnections(remainingClients - 1);
	});

	socket.on('message', (e) => {
		let json = e;

		/* Keep track of our one share value (even though current strategy doesn't care for value) */
		for (let share in json) {
			value = json[share];
		}
	});

	socket.on('close', () => {
		console.log("We did not expect any client to disconnect, exiting!");
		process.exit();
	});
}

establishConnections(numClients);