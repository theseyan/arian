var uws = require('uWebSockets.js');
const hyperid = require('hyperid')({urlSafe: true});
var ServerIOInterface = require('./ServerIOInterface');
var NATSService = require('./NATSService');

/**
 * ArianServer class
*/
class ArianServer {

    /**
     * Constants
    */
    ROOM_PREFIX = 'arian_room_';
    CHANNEL_PREFIX = 'arian_channel_';

    /**
     * Defaults
    */
    uws = null;
    standalone = true;
    nats = null;
    serverId = null;

    /**
     * Stores a map of pending Requests
     * @type {Map<string, object>}
    */
    requests = new Map();

    /**
     * Stores a map of active NATS channels
     * @type {Map<string, object>}
    */
    channels = new Map();

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

        // Assign a Server ID
        this.serverId = hyperid();

        // Check if server is running in standalone mode
        if('nats' in config) {
            this.standalone = false;
            this.nats = new NATSService(this, config.nats, this.io);
        }
    }

    /**
     * @param {number} port - Listening port for incoming connections
     * @returns {Promise}
    */
    listen(port) {
        return new Promise((resolve, reject) => {
            this.uws = uws.App().ws(this.config.route, {

                // Disable compression, since we use MessagePack
                compression: uws.DISABLED,

                // Use provided config or defaults
                maxPayloadLength: this.config.maxPayloadLength,
                idleTimeout: this.config.idleTimeout,
                maxBackpressure: this.config.maxBackpressure,
            
                // Fired when an HTTP Upgrade request is received
                upgrade: (res, req, context) => {
                    // Fetch query parameters
                    const params = Object.fromEntries(new URLSearchParams(req.getQuery()).entries());

                    // Upgrade the request
                    res.upgrade({
                            url: req.getUrl(),
                            data: params
                        },
                        req.getHeader('sec-websocket-key'),
                        req.getHeader('sec-websocket-protocol'),
                        req.getHeader('sec-websocket-extensions'),
                        context
                    );
                },

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