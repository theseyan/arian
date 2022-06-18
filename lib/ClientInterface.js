const hyperid = require('hyperid')({urlSafe: true});
const EventEmitter = require('@foxify/events').default;
const Protocol = require('./Protocol');

/**
 * Client Connection Interface
*/
class ClientInterface extends EventEmitter {

    ws = null;
    id = null;
    server = null;

    /**
     * @param {uws.WebSocket} ws - WebSocket interface from uws module
    */
    constructor(ws, server) {
        super();
        this.ws = ws;
        this.server = server;

        // Assign a UUID to this client
        this.id = ws.key = hyperid();
    }

    /**
     * Sends data to the connnected client
     * @param {string} event - Optional event name to emit to the client
     * @param {string} message - Message payload to be sent to the client
    */
    send(event, message) {

        if(typeof message=="undefined") {
            message = event;
            event = 'message';
        }

        var payload = Protocol.message(event, message);
        this.ws.send(payload, true, false);

    }

    /**
     * Sends a message to all clients in a room (except this client)
     * @param {string} room - Name of the room
     * @param {string} [event] - Optional event name to emit
     * @param {string} message - Message payload to be sent to the clients
    */
    sendToRoom(room, event, message) {
        if(typeof message=="undefined") {
            message = event;
            event = 'message';
        }

        var payload = Protocol.message(event, message);
        this.ws.publish(this.server.ROOM_PREFIX + room, payload, true, false);
    }

    /**
     * Joins or creates a room (if it doesn't exist)
     * @param {string} room - Name of the room
    */
    join(room) {
        if(!this.server.rooms.has(room)) {
            this.server.rooms.set(room, new Set());

            if(!this.server.standalone) {
                // Listen to room channel
                this.server.nats.listenRoom(room);
            }
        }

        // Subscribe to room topic
        this.ws.subscribe(this.server.ROOM_PREFIX + room);

        // Add Client ID to room list
        this.server.rooms.get(room).add(this.id);
    }

    /**
     * Leaves a room
     * @param {string} room - Name of the room
    */
    leave(room) {
        if(!this.server.rooms.has(room)) return;

        // Unsubscribe to room topic
        this.ws.unsubscribe(this.server.ROOM_PREFIX + room);

        // Remove Client ID from room list
        this.server.rooms.get(room).delete(this.id);

        // Delete room if nobody is connected
        if(this.server.rooms.get(room).size == 0) {
            this.server.rooms.delete(room);

            if(!this.server.standalone) {
                // Unsubscribe Room channel
                this.server.nats.unsubRoom(room);
            }
        }
    }

}

module.exports = ClientInterface;