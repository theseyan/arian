var Protocol = require('./Protocol');

/**
 * NATS Service
*/
class NATSService {

    /**
     * Constants
    */
    REQUEST_TIMEOUT = 1500;

    nats = null;
    server = null;
    io = null;

    // Stores the Request channel subscriber
    reqSub = null;

    // Stores the Request channel subscriber
    respSub = null;

    /**
     * @param {ArianServer} server
     * @param {NatsConnection} nats
     * @param {ServerIOInterface} io
    */
    constructor(server, nats, io) {
        this.server = server;
        this.nats = nats;
        this.io = io;

        // Initialize channels
        this.listen();
    }

    /**
     * Sends a Request to all servers in the cluster
     * @param {string} type - Type of Request
     * @param {object} body - Body of Request
    */
    request(type, body) {
        return new Promise((resolve, reject) => {
            var obj = Protocol.request(type, body, this.server.serverId);

            // Add request to pending requests
            this.server.requests.set(obj.id, {
                body: body,
                responses: []
            });

            // Publish Request
            this.nats.publish(this.server.CHANNEL_PREFIX + 'general', obj.buffer.buffer);
            
            // Re-use buffer
            obj.buffer.done();

            // Resolve the request on reaching timeout
            setTimeout(() => {
                this.resolveRequest(obj.id, resolve);
            }, this.REQUEST_TIMEOUT);
        });
    }

    /**
     * Sends a Response to a specific server
     * @param {string} id - Request/Response ID
     * @param {string} type - Type of Response
     * @param {object} body - Body of Response
     * @param {string} to - Server ID of original requester
    */
    respond(id, type, body, to) {
        var obj = Protocol.respond(id, type, body, this.server.serverId);

        // Publish Response
        this.nats.publish(this.server.CHANNEL_PREFIX + 'respond-' + to, obj.buffer);
        
        // Re-use buffer
        obj.done();
    }

    // Resolves a pending request
    resolveRequest(id, resolve) {
        resolve(this.server.requests.get(id).responses);
        this.server.requests.delete(id);
    }

    /**
     * Starts listening for Requests & Responses from other servers
    */
    listen() {

        // Subscribe to request and response channels
        this.reqSub = this.nats.subscribe(this.server.CHANNEL_PREFIX + 'general');
        this.respSub = this.nats.subscribe(this.server.CHANNEL_PREFIX + 'respond-' + this.server.serverId);

        // Register message listeners
        this.registerListeners();

    }

    /**
     * Sends a message to a Room channel
     * @param {string} room - Name of the Room
     * @param {string} [event] - Optional custom event name
     * @param {object} message - Message body
    */
    sendMessage(room, event, message) {
        if(typeof message=="undefined") {
            message = event;
            event = 'message';
        }

        var buffer = Protocol.serverMessage(event, message, room, this.server.serverId);
        this.nats.publish(this.server.CHANNEL_PREFIX + 'room-' + room, buffer.buffer);
        
        // Re-use buffer
        buffer.done();
    }

    /**
     * Unsubscribes from a Room channel
     * @param {string} room - Name of the Room
    */
    async unsubRoom(room) {
        if(this.server.channels.has(room)) await this.server.channels.get(room).unsubscribe();
        this.server.channels.delete(room);
    }

    /**
     * Starts listening for Messages in a channel
     * @param {string} room - Name of the room
    */
    listenRoom(room) {
        if(this.server.channels.has(room)) return;

        this.server.channels.set(room, this.nats.subscribe(this.server.CHANNEL_PREFIX + 'room-' + room));
        this.registerRoomListeners(room);
    }

    /*
     * Registers message listeners for a Room channel
    */
    registerRoomListeners(room) {
        (async () => {
            for await (const m of this.server.channels.get(room)) {
                var data = Protocol.decode(m.data);

                // Stop if the message is from this server
                if(data.f == this.server.serverId) continue;

                // Message received but room does not exist in server anymore
                if(!this.server.rooms.has(room)) {
                    await this.unsubRoom(room);
                    return;
                };
            
                // Send or emit the message
                if(data.d.e == 'message') this.io.send(data.d.r, data.d.m, {local: true});
                else this.io.emit(data.d.r, data.d.e, data.d.m, {local: true});
            }
        })();
    }
    
    /*
     * Registers message listeners on Request and Response channels
    */
    registerListeners() {
        // General Requests listener
        (async () => {
            for await (const m of this.reqSub) {
                var data = Protocol.decode(m.data);

                // Only handle requests from other servers
                if(data.m != 'request' || data.f == this.server.serverId) continue;

                /**
                 * serverCount() method
                */
                if(data.t == 'SERVER_COUNT') {
                    this.respond(data.id, data.t, {
                        id: this.server.serverId
                    }, data.f);
                }

                /**
                 * fetchSockets() method
                */
                if(data.t == 'FETCH_SOCKETS') {
                    // Respond with list of sockets
                    this.respond(data.id, data.t, {
                        sockets: this.io.local.fetchSockets(data.d.room ? data.d.room : undefined)
                    }, data.f);
                }

                /**
                 * countSockets() method
                */
                 if(data.t == 'COUNT_SOCKETS') {
                    // Respond with number of sockets
                    this.respond(data.id, data.t, this.io.local.countSockets(data.d.room ? data.d.room : undefined), data.f);
                }
            }
        })();

        // Response listener
        (async () => {
            for await (const m of this.respSub) {
                var data = Protocol.decode(m.data);

                // Register response if the request exists in memory
                if(data.m == 'response' && this.server.requests.has(data.id) && data.f != this.server.serverId) {
                    this.server.requests.get(data.id).responses.push(data.d);
                }
            }
        })();
    }

}

module.exports = NATSService;