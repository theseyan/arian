const { ArianServer } = require('../index');
const nats = require('nats');
const natsConfig = require('./config.json');

// Connect to NATS
nats.connect(natsConfig).then(client => {
    console.log("NATS connected to " + client.getServer());

    // Create websocket servers
    var server1 = new ArianServer({
        nats: client
    });
    var server2 = new ArianServer({
        nats: client
    });

    // Start Server1
    server1.listen(3000).then(function(io) {
        console.log('Server1 listening to Port 3000');

        // Listen for connections
        io.events.on('connect', client => {

            console.log(`Client ${client.id} connected to Server1`);

            // Listen for messages
            client.on('message', data => {
                console.log('[Server1]', data);
            });

            // Join a room
            client.join('myRoom');

            // Fired when the client disconnects
            client.on('close', (id) => {
                console.log(`Client ${id} disconnected from Server1`);
            });

        });
    });

    // Start Server2
    server2.listen(3001).then(function(io) {
        console.log('Server2 listening to Port 3001');

        // Listen for connections
        io.events.on('connect', client => {

            console.log(`Client ${client.id} connected to Server2`);

            // Listen for messages
            client.on('message', data => {
                console.log('[Server2]', data);
            });

            // Join a room
            client.join('myRoom');

            // Send a message to all users in the room
            setTimeout(() => {
                io.send('myRoom', {
                    msg: 'A message sent to the room from Server2!'
                });
            }, 1000);

            // Fired when the client disconnects
            client.on('close', (id) => {
                console.log(`Client ${id} disconnected from Server2`);
            });

        });
    });

}).catch(e => {
    throw new Error("Could not connect to NATS: " + e);
});