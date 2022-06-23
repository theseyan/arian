const EventEmitter = require('@foxify/events').default;
const Protocol = require('./Protocol');

/**
 * Arian Client
*/
class ArianClient extends EventEmitter {

    ws = null;
    url = null;

    /**
     * @param {WebSocket} ws - Spec compliant Websocket instance
    */
    constructor(ws) {
        super();

        this.ws = ws;
        this.url = ws.url;

        // Register event handlers
        this.init(this);
    }

    /**
     * Registers event handlers
    */
    init(t) {

        // Fired on connection error
        this.ws.onerror = (e) => {
            this.emit('error', e);
        };
        
        // Fired when the connection is opened
        this.ws.onopen = () => {
            if (this.ws.readyState === this.ws.OPEN) {
                this.emit('connect', this.ws.readyState);
            }
        };
        
        // Fired when the connection is closed
        this.ws.onclose = () => {
            this.emit('close');
        };
        
        // Fired when a message arrives
        this.ws.onmessage = function(e) {
            var data = Protocol.parseData(e.data);

            if(data.type != 'command') {
                t.emit(data.event ? data.event : 'message', data.message);
            }
        };

    }

    /**
     * Sends a custom event or generic message to server
     * @param {string} event - Optional custom event to send
     * @param {string} message - Message payload to send to server
    */
    send(event, message) {

        if(typeof message=="undefined") {
            message = event;
            event = 'message';
        }
        
        var payload = Protocol.message(event, message);
        this.ws.send(payload.buffer);
    
        // Re-use buffer
        payload.done();
    }

}

module.exports = ArianClient;