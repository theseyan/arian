const ClientInterface = require('./ClientInterface');
const EventEmitter = require('@foxify/events').default;
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
     * @param t - Reference to ServerIOInterface
    */
    init(t) {
        
        // Fired when a Websocket connection is opened
        this.__events.on('open', function(ws) {

            var client = new ClientInterface(ws, t.server);

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

    /**
     * Sends a custom event message to all clients in a room
     * @param {string} room - Name of the room
     * @param {string} event - Event name to emit
     * @param {string} message - Message payload to be sent to the clients
    */
    emit(room, event, message, flags = {local: false}) {
        var payload = Protocol.message(event, message);
        this.server.uws.publish(this.server.ROOM_PREFIX + room, payload.buffer, true, false);

        // Re-use buffer
        payload.done();

        // Send to other servers in cluster
        if(!this.server.standalone && flags?.local === false) {
            this.server.nats.sendMessage(room, event, message);
        }
    }

    /**
     * Sends a generic message to all clients in a room
     * @param {string} room - Name of the room
     * @param {string} message - Message payload to be sent to the clients
    */
    send(room, message, flags = {local: false}) {
        var payload = Protocol.message('message', message);
        this.server.uws.publish(this.server.ROOM_PREFIX + room, payload.buffer, true, false);

        // Re-use buffer
        payload.done();

        // Send to other servers in cluster
        if(!this.server.standalone && flags?.local === false) {
            this.server.nats.sendMessage(room, 'message', message);
        }
    }

    /**
     * Counts the total number of servers
     * @returns {number} Number of servers
    */
    async serverCount() {
        var count = await this.server.nats.request('SERVER_COUNT', {});
        return (count.length + 1);
    }

}

module.exports = ServerIOInterface;