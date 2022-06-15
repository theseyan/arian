const hyperid = require('hyperid')({urlSafe: true});

/**
 * Client Connection Interface
*/
class ClientInterface {

    ws = null;
    id = null;

    /**
     * @param {uws.WebSocket} - WebSocket interface from uws module
    */
    constructor(ws) {
        this.ws = ws;

        // Assign a UUID to this client
        this.id = ws.key = hyperid();
    }



}

module.exports = ClientInterface;