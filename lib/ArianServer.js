var uws = require('uWebSockets.js');
var ServerIOInterface = require('./ServerIOInterface');

/**
 * ArianServer class
*/
class ArianServer {

    /**
     * Constants
    */
    ROOM_PREFIX = 'arian_room_';

    uws = null;

    /**
     * Stores a map of connected clients
     * @type {Map<string, object>}
    */
    clients = new Map();

    /**
     * Stores a map of rooms
     * @type {Map<string, Set>}
    */
    rooms = new Map();

    /** 
     * Creates Server IO interface
    */
    io = new ServerIOInterface(this);

    /**
     * Default configuration
    */
    config = {
        route: '/*',
        uws: {
            maxPayloadLength: 16 * 1024 * 1024,
            idleTimeout: 10,
            maxBackpressure: 1024
        }
    };

    /**
     * @param {object} config - Server configuration object
    */
    constructor(config) {
        this.config = {...this.config, ...config};

        // Check if server is running in standalone mode
        if(!'nats' in config) {
            this.standalone = true;
        }
    }

    /**
     * @param {number} port - Listening port for incoming connections
     * @returns {Promise}
    */
    listen(port) {
        return new Promise((resolve, reject) => {
            this.uws = uws.App().ws(this.config.route, {

                compression: uws.DISABLED,
                maxPayloadLength: this.config.maxPayloadLength,
                idleTimeout: this.config.idleTimeout,
                maxBackpressure: this.config.maxBackpressure,
            
                // Fired when a Websocket connection is opened
                open: (ws) => {
                    this.io.__events.emit('open', ws);
                },

                // Fires on new message
                message: (ws, message, isBinary) => {
                    this.io.__events.emit('message', ws, message, isBinary);
                },

                // Fired when backpressure is draining
                drain: (ws) => {
                    this.io.__events.emit('drain', ws);
                },

                // Fired when connection is closed
                close: (ws, code, message) => {
                    this.io.__events.emit('close', ws, code, message);
                }

            }).any('/*', (res, req) => {

                // TODO: Repond with something else?
                res.end('Arian Server');

            }).listen(port, (token) => {

                if(!token) return reject(new Error(`Failed to listen to port ${port}`));

                // Resolve promise
                resolve(this.io);

            });
        });
    }

}

module.exports = ArianServer;