const hyperid = require('hyperid')({urlSafe: true});
const { Packr } = require('msgpackr');

var MsgBuffer = typeof Buffer !== 'undefined' ? Buffer.allocUnsafeSlow(8192) : new Uint8Array(8192);

// We use record structures extension better performance
const packr = new Packr({structures: [["id", "m", "t", "d", "f"], ["m", "e"]], maxSharedStructures: 2});

packr.useBuffer(MsgBuffer);

/**
 * Defines protocol for Server-Client and Server-Server communication
*/
class Protocol {
    
    /**
     * Encodes a payload for transport to other servers in a cluster
     * @param {string} messageId - Message ID for this request/response
     * @param {string} reqres - Possible values are:
     *                          "request" - This payload contains a request
     *                          "response" - This payload contains a response
     *                          "message" - This payload contains a Websocket message
     * @param {string} type - Type of request/response, or "message" for websocket messages
     * @param {string} from - Server ID to use as sender
     * @returns {Buffer} - Encoded payload buffer ready for transport
    */
    static makeServerBody(messageId, reqres, type, body, from) {
        var obj = {
            id: messageId,
            m: reqres,
            t: type,
            d: body,
            f: from
        };

        return {
            buffer: packr.pack(obj),
            done: function() {
                // Re-use the buffer
                packr.useBuffer(MsgBuffer);
            }
        };
    }

    /**
     * Decodes a MessagePack buffer
     * @param {Buffer} buffer - The MessagePack buffer
     * @returns {Object} Decoded buffer content
    */
    static decode(buffer) {
        return packr.unpack(buffer);
    }

    /**
     * Encodes a Websocket message for transport to other servers
     * @param {string} event - Optional custom event name
     * @param {string} message - Message body to send
     * @param {string} room - Name of room to broadcast to
     * @param {string} serverId - Server ID to use as sender
     * @returns {Buffer} - Encoded payload buffer ready for transport
    */
    static serverMessage(event, message, room, serverId) {
        var body = {
            m: message,
            r: room
        };

        if(event) body.e = event;
        return this.makeServerBody(null, 'message', 'message', body, serverId);
    }

    /**
     * Creates a protocol Request to be sent to other servers
     * @param {string} type - Type of Request
     * @param {string} body - Body of Request
     * @param {string} serverId - Server ID to use as sender
     * @returns {Buffer} - Encoded payload buffer ready for transport
    */
    static request(type, body, serverId) {
        var id = hyperid();

        return {id: id, buffer: this.makeServerBody(id, 'request', type, body, serverId)};
    }

    /**
     * Creates a protocol Response to be sent to other servers
     * @param {string} id - ID of the original Request
     * @param {string} type - Type of Response
     * @param {string} body - Body of Response
     * @param {string} serverId - Server ID to use as sender
     * @returns {Buffer} - Encoded payload buffer ready for transport
    */
    static respond(id, type, body, serverId) {
        return this.makeServerBody(id, 'response', type, body, serverId);
    }

    /**
     * Encodes a payload for transport to client
     * @param {string} event - Custom event or 'message' (generic message)
     * @param {string} message - Payload
     * @returns {Buffer} - Encoded payload buffer ready for transport
    */
    static makeClientBody(event, message) {
        var payload = {
            m: message,
            e: event
        };

        return {
            buffer: packr.pack(payload),
            done: function() {
                // Re-use the buffer
                packr.useBuffer(MsgBuffer);
            }
        };
    }

    /**
     * Creates a message
     * @param {string} event - Optional event name to send to client
     * @param {string} message - Message payload to send to client
     * @returns {Buffer} - Encoded payload buffer ready for transport
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

        var data = packr.unpack(new Uint8Array(payload));

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