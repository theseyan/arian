<div align="center">
<h1>Arian</h1>

<i>
An opinionated, massively scalable, superfast Websocket server powered by <a href="https://github.com/uNetworking/uWebSockets.js">µWebSockets.js</a> and <a href="https://nats.io/">NATS</a>.
</i>
</div>

# Work in Progress

This is a work in progress, the project is vastly incomplete and not ready for use in production.

## :zap: Blazing Speed

Arian runs on native µWebSockets, which by itself is about **[10x faster than Socket.IO](https://medium.com/swlh/100k-secure-websockets-with-raspberry-pi-4-1ba5d2127a23)** - the most widely used websocket library.  
The Arian Server and Client communicate in a binary protocol with almost no overhead, through the fastest implementation of [MessagePack](https://msgpack.org/) for Node.js.

## :globe_with_meridians: Seamlessly Scalable

Although a single server can handle *several thousands of concurrent connections*, Arian lets you seamlessly scale horizontally by simply adding more servers.  
Hundreds of nodes can work together in tandem using NATS as a message broker, which is completely transparent to the higher level client and server APIs.
Spinning up more servers will linearly increase throughput and connection capacity with **no changes in code required**.

## :battery: Batteries Included

Arian comes with full support for Rooms, Pub/Sub and broadcasting, while maintaining minimal memory overhead.