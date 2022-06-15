var uws = require('uWebSockets.js');
var ServerIOInterface = require('./ServerIOInterface');

/**
 * ArianServer class
*/
class ArianServer {

    uws = null;
    io = null;

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
    }

    /**
     * @param {number} port - Listening port for incoming connections
    */
    listen(port) {
        return new Promise((resolve, reject) => {
            this.uws = uws.App().ws(this.config.route, {

                compression: uws.DISABLED,
                maxPayloadLength: this.config.maxPayloadLength,
                idleTimeout: this.config.idleTimeout,
                maxBackpressure: this.config.maxBackpressure,
            
                // Fires when a Websocket connection is opened
                open: (ws) => {
                    ws.subscribe('home/sensors/#');
                },

                // Fires on new message
                message: (ws, message, isBinary) => {
                    ws.publish('home/sensors/temperature', message);
                    ws.publish('home/sensors/light', message);
                },

                // Fired when backpressure is draining
                drain: (ws) => {
            
                },

                // Fired when connection is closed
                close: (ws, code, message) => {

                }

            }).any('/*', (res, req) => {

                res.end('Arian Server');

            }).listen(port, (token) => {

                if(!token) return reject(new Error(`Failed to listen to port ${port}`));
                
                // Create Server IO interface
                this.io = new ServerIOInterface(this);

                resolve(this.io);

            });
        });
    }

}

module.exports = ArianServer;