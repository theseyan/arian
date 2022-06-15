const ClientInterface = require('./ClientInterface');
const EventEmitter = require('events');
const Protocol = require('./Protocol');

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

        // Fired when a message arrives from client
        this.__events.on('message', function(ws, message, isBinary) {

            // Extract data from message
            var data = Protocol.parseData(message);

            if(data.type != 'command') {
                // Emit message to event handlers
                t.server.clients.get(ws.key).emit(data.event ? data.event : 'message', data.message);
            }

        });

        // Fired when a Websocket connection is closed
        this.__events.on('close', function(ws) {

            // Fire Client 'close' event
            t.server.clients.get(ws.key).emit('close', ws.key);

            // Remove client from list of connected clients
            t.server.clients.delete(ws.key);

            // Fire 'close' event
            t.events.emit('close', ws.key);

        });

    }

}

module.exports = ServerIOInterface;