/* Simplified stock exchange made with Arian pub/sub */
const { ArianServer } = require('../../../index');

/* We measure transactions per second server side */
let transactionsPerSecond = 0;

/* Share valuations */
let shares = {
	'NFLX': 280.48,
	'TSLA': 244.74,
	'AMZN': 1720.26,
	'GOOG': 1208.67,
	'NVDA': 183.03
};

// Create websocket server
var server = new ArianServer({});

/* Define the server */
server.listen(3000).then(function(io) {

    io.events.on('connect', function(socket) {
        socket.on('message', (message) => {
            let json = message;
            switch (json.action) {
                case 'sub': {
                    /* Subscribe to the share's value stream */
                    socket.join('shares/' + json.share + '/value');
                    break;
                }
                case 'buy': {
                    transactionsPerSecond++;

                    /* For simplicity, shares increase 0.1% with every buy */
                    shares[json.share] *= 1.001;

                    /* Value of share has changed, update subscribers */
                    io.emit('shares/' + json.share + '/value', 'message', {[json.share]: shares[json.share]});
                    break;
                }
                case 'sell': {
                    transactionsPerSecond++;

                    /* For simplicity, shares decrease 0.1% with every sale */
                    shares[json.share] *= 0.999

                    io.emit('shares/' + json.share + '/value', 'message', {[json.share]: shares[json.share]});
                    break;
                }
            }
        });
    });

});

/* Print transactions per second */
let last = Date.now();
setInterval(() => {
	transactionsPerSecond /= ((Date.now() - last) * 0.001)
	console.log("Transactions per second: " + transactionsPerSecond + "");
	//console.log(shares);
    var mem = process.memoryUsage();
    console.log("Memory Usage: ", Math.round(mem.heapUsed/1000000) + "MB out of " + Math.round(mem.heapTotal/1000000) + "MB");
	console.log("");
	transactionsPerSecond = 0;
	last = Date.now();
}, 1000);