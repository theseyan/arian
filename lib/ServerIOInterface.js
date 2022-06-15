/**
 * Server IO Interface
 * Implements the Server API
*/
class ServerIOInterface {

    server = null;

    /**
     * @param {ArianServer} server - The ArianServer instance
    */
    constructor(server) {
        this.server = server;
    }

}

module.exports = ServerIOInterface;