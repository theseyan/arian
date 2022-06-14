<div align="center">
<h1>Arian</h1>

<i>
An opinionated, massively scalable, superfast Websocket server powered by <a href="https://github.com/uNetworking/uWebSockets.js">µWebSockets.js</a> and <a href="https://nats.io/">NATS</a>.
</i>
</div>

# Work in Progress

This is a work in progress, the project is vastly incomplete and not ready for use in production.

## Blazing Speed

Arian server runs on native µWebSockets, which by itself is about [10x faster than Socket.IO](https://medium.com/swlh/100k-secure-websockets-with-raspberry-pi-4-1ba5d2127a23) - the most widely used websockets library.
Both server and clients communicate in binary, through the fastest implementation of [MessagePack](https://msgpack.org/) for Node.js.

## Seamlessly Scalable

Arian is seamlessly horizontally scalable through NATS. Hundreds of servers can work in tandem though inter communication with NATS, which is completely transparent to 
the client and the server.
Spinning up more servers will linearly increase message throughput and connection capacity.