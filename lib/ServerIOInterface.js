const ClientInterface = require('./ClientInterface');
const EventEmitter = require('events');

/**
 * Server IO Interface
 * Implements the Server API
*/
class ServerIOInterface {

    server = null;

    /**
     * Interface event emitter
    */
    events = new EventEmitter();

    /**
     * Internal event emitter
    */
    __events = new EventEmitter();

    /**
     * @param {ArianServer} server - The ArianServer instance
    */
    constructor(server) {
        this.server = server;

        // Register event handlers
        this.init(this);
    }

    /**
     * Registers event handlers
    */
    init(t) {
        
        // Fired when a Websocket connection is opened
        this.__events.on('open', function(ws) {

            var client = new ClientInterface(ws);

            // Add client to list of connected clients
            t.server.clients.set(client.id, client);

            // Fire 'connect' event
            t.events.emit('connect', client);

        });

        // Fired when a Websocket connection is closed
        this.__events.on('close', function(ws) {

            // Remove client from list of connected clients
            t.server.clients.delete(ws.key);

            // Fire 'close' event
            t.events.emit('close', ws.key);

        });

    }

}

module.exports = ServerIOInterface;