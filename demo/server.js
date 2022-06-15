const { ArianServer } = require('../index');
const nats = require('nats');
const natsConfig = require('./config.json');

// Connect to NATS
nats.connect(natsConfig).then(client => {
    console.log("NATS connected to " + client.getServer());

    // Create websocket server
    var server = new ArianServer({
        nats: client
    });

    // Start listening
    server.listen(3000).then(io => {
        console.log('Listening to Port 3000');

        
    });

}).catch(e => {
    throw new Error("Could not connect to NATS: " + e);
});