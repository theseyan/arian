const EventEmitter = require('events');

/**
 * Arian Client
*/
class ArianClient {

    ws = null;
    url = null;

    /**
     * Client event emitter
    */
    events = new EventEmitter();

    /**
     * @param {WebSocket} ws - Spec compliant Websocket instance
     * @param {string} url - Websocket URL
    */
    constructor(ws, url) {
        this.ws = ws;
        this.url = url;

        // Register event handlers
        this.init();
    }

    /**
     * Registers event handlers
    */
    init() {

        // Fired on connection error
        this.ws.onerror = (e) => {
            console.log('Connection Error');

            this.events.emit('error', e);
        };
        
        // Fired when the connection is opened
        this.ws.onopen = () => {
            console.log('WebSocket Client Connected');
        
            if (this.ws.readyState === this.ws.OPEN) {
                this.events.emit('open', this.ws.readyState);
            }
        };
        
        // Fired when the connection is closed
        this.ws.onclose = () => {
            console.log('echo-protocol Client Closed');

            this.events.emit('close');
        };
        
        // Fired when a message arrives
        this.ws.onmessage = (e) => {
            console.log(e.data);
            if (typeof e.data === 'string') {
                console.log("Received: '" + e.data + "'");
            }
        };

    }

}

module.exports = ArianClient;