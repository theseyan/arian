const hyperid = require('hyperid')({urlSafe: true});
const EventEmitter = require('events');
const Protocol = require('./Protocol');

/**
 * Client Connection Interface
*/
class ClientInterface extends EventEmitter {

    ws = null;
    id = null;

    /**
     * @param {uws.WebSocket} - WebSocket interface from uws module
    */
    constructor(ws) {
        super();
        this.ws = ws;

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

}

module.exports = ClientInterface;