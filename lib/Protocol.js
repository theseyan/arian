const { unpack, pack } = require('msgpackr');

/**
 * Defines protocol for Server-Client and Server-Server communication
*/
class Protocol {
    
    /**
     * Encodes a payload for transport to client
     * @param {string} event - Custom event or 'message' (generic message)
     * @param {string} message - Payload
    */
    static makeClientBody(event, message) {
        var payload = {
            m: message
        };

        if(typeof event!="message") payload.e = event;
        return pack(payload);
    }

    /**
     * Creates a message
     * @param {string} event - Optional event name to send to client
     * @param {string} message - Message payload to send to client
    */
    static message(event, message) {
        return this.makeClientBody(event, message);
    }

    /**
     * Parses payload received to extract Custom event, message or command
     * @param {Object} data - Payload received
     * @returns {Object} Extracted data
    */
    static parseData(payload) {
        var data = unpack(new Uint8Array(payload));

        // Server sent a command
        if('c' in data) {
            return {
                type: 'command',
                command: data.e
            };
        }

        // Server sent message with custom event
        else if('e' in data && 'm' in data) {
            return {
                type: 'custom',
                event: data.e,
                message: data.m
            }
        }

        // Server sent generic message
        else if('m' in data) {
            return {
                type: 'message',
                message: data.m
            }
        }
    }

}

module.exports = Protocol;