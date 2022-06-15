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

        // Listen for connections
        io.events.on('connect', client => {

            console.log(`Client ${client.id} connected`);

            // Send custom event message
            client.send('customEvent', {
                msg: 'this is a message'
            });

            // Listen for messages
            client.on('message', data => {
                console.log(data);
            });

            // Listen for custom client event
            client.on('customClientEvent', data => {
                console.log(data);
            });

            // Join a room
            client.join('myRoom');

            // Send a message to all users in the room
            io.send('myRoom', {
                msg: 'A message sent to the room!'
            });

            // Fired when the client disconnects
            client.on('close', (id) => {
                console.log(`Client ${id} disconnected`);
            });

        });
    });

}).catch(e => {
    throw new Error("Could not connect to NATS: " + e);
});