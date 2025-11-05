[![Build Status](https://travis-ci.org/ambelovsky/koa-socket-2.svg?branch=master)](https://travis-ci.org/ambelovsky/koa-socket-2)
[![NPM Version](https://img.shields.io/npm/v/koa-socket-2.svg)](https://npmjs.com/packages/koa-socket-2)

# Koa-socket-2

> Sugar for connecting socket.io to a Koa instance

**Koa-socket-2 uses socket.io v3.  It is recommended that you connect to a koa-socket-2 server with a socket.io v3 client.**

Koa-socket-2 is only compatible with Koa v2 style of middleware (where context is passed as a parameter).

Koa-socket-2 requires Node v7.0.0 or higher.

## Interested in GoLang?

This project helps you start a SocketIO server using Koa and NodeJS.  However, Google's Go language -- or GoLang -- allows you to write code that compiles down to binary.  It can be a very good way to take your SocketIO server to the next level by running faster and requiring less overhead than runtime environments like NodeJS.

If you're interested in building a SocketIO server in GoLang, take a look at [gosf.io](http://gosf.io) or [GOSF on GitHub](https://github.com/ambelovsky/gosf), the GoLang SocketIO Framework for building SocketIO API servers.

## Installation

```sh
npm i -S koa-socket-2
```

## HTTP Example

Please make the world a better place and stop using unsecure channels.  If you
absolutely must, however, then the following will get you started.

```js
const Koa = require('koa');
const IO = require('koa-socket-2');

const app = new Koa();
const io = new IO();

app.use( ... );

io.attach(app);

io.on('message', (ctx, data) => {
  console.log('client sent data to message endpoint', data);
});

app.listen( process.env.PORT || 3000 );
```

## HTTPS Example

```js
const Koa = require('koa');
const IO = require('koa-socket-2');
const fs = require('fs');

// If you want to access the HTTPS server from a local JS client for
// development, then try this simple plugin:
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', 'null');
  ctx.set('Access-Control-Allow-Credentials', 'true');
  await next();
});

const app = new Koa();
const io = new IO();

app.use( ... );

// Replace the "..." placeholders below with your own SSL certificate files
io.attach(app, true, {
  key: fs.readFileSync(...),
  cert: fs.readFileSync(...),
  ca: fs.readFileSync(...)
});

console.log('Server: HTTPS/TLS Enabled.');

io.on('message', (ctx, data) => {
  console.log('client sent data to message endpoint', data);
});

app.listen(process.env.PORT || 3000);
```

## Features

* Attach socket.io to existing koa projects
* Attach koa-style middleware to socket.io events
* Supports koa v2 style of passing context along the response chain


## Attaching to existing projects

The `attach` function is used to attach the `IO` instance to the application, this adds `server`\* and `io` properties to the koa application and should happen before the app starts listening on a port.

It also re-maps `app.listen` to `app.server.listen`, so you could simply do `app.listen()`. However if you already had an `app.server` attached, it uses it instead and expects you to do `app.server.listen()` yourself.

```js
const Koa = require( 'koa' );
const IO = require( 'koa-socket-2' );

const app = new Koa();
const io = new IO();

// Attach the socket to the application
io.attach( app );

// Socket is now available as app.io if you prefer
app.io.on( event, eventHandler );

// The raw socket.io instance is attached as app._io if you need it
app._io.on( 'connection', sock => {
  // ...
});

// *If* you had manually attached an `app.server` yourself, you should do:
app.listen = function() {
  app.server.listen.apply(app.server, arguments);
  return app.server;
}

// app.listen is mapped to app.server.listen, so you can just do:
app.listen( process.env.PORT || 3000 );
```

## Middleware and event handlers

Middleware can be added in much the same way as it can be added to any regular koa instance.

### Example with *async* functions

```js
io.use( async ( ctx, next ) => {
  let start = new Date();
  await next();
  console.log( `response time: ${ new Date() - start }ms` );
})
```


### Example with generator functions

Don't use generator functions.  Get with the times, and upgrade to Node >= 7.X.X.


### Plain example

Whilst slightly unwieldy, the standalone method also works

```js
io.use( ( ctx, next ) => {
  let start = new Date()
  return next().then( () => {
    console.log( `response time: ${ new Date() - start }ms` )
  })
})
```


## Passed Context

```js
let ctx = {
  event: listener.event,
  data: data,
  socket: Socket,
  acknowledge: cb
}
```

The context passed to each socket middleware and handler begins the chain with the event that triggered the response, the data sent with that event and the socket instance that is handling the event. There is also a shorthand for firing an acknowledgement back to the client.

As the context is passed to each function in the response chain it is fair game for mutation at any point along that chain, it is up to you to decide whether this is an anti-pattern or not. There was much discussion around this topic for koa v2.


```js
io.use( async ( ctx, next ) => {
  ctx.process = process.pid
  await next()
})

io.use( async ( ctx, next ) => {
  // ctx is passed along so ctx.process is now available
  console.log( ctx.process )
})

io.on( 'event', ( ctx, data ) => {
  // ctx is passed all the way through to the end point
  console.log( ctx.process )
})
```


## Namespaces

Namespaces can be defined simply by instantiating a new instance of `koaSocket` and passing the namespace id in the constructor. All other functionality works the same, it’ll just be constrained to the single namespace.

```js
const app = new Koa()
const chat = new IO({
  namespace: 'chat'
});

chat.attach( app );

chat.on( 'message', ctx => {
  console.log( ctx.data );
  chat.broadcast( 'response', ... );
});
```

Namespaces also attach themselves to the `app` instance, throwing an error if the property name already exists.

```js
const app = new Koa();
const chat = new IO({
  namespace: 'chat'
});

chat.attach( app );

app.chat.use( ... );
app.chat.on( ... );
app.chat.broadcast( ... );
```

The attachment is configurable if you don’t want to muddy the `app` object with all your namespaces.

```js
const chat = new IO({
  namespace: 'chat',
  hidden: true
});

chat.use( ... );
chat.on( ... );
```

Namespaces are fairly ubiquitous so they get a dirty shorthand for creating them, note that if you want to add any additional options you’ll need to use the longhand object parameter to instantiate `koaSocket`.

```js
const chat = new IO( 'chat' );
```


## IO API

### .attach( `Koa app` )

Attaches to a koa application

```js
io.attach( app );
app.listen( process.env.PORT );
```

### .use( `Function callback` )

Applies middleware to the stack.

Middleware are executed each time an event is reacted to and before the callback is triggered for an event.

Middleware with generators should use `co.wrap`.

Middleware functions are called with `ctx` and `next`. The context is passed through each middleware and out to the event listener callback. `next` allows the middleware chain to be traversed. Under the hood `koa-compose` is used to follow functionality with `koa`.


```js
io.use( async ( ctx, next ) {
  console.log( 'Upstream' );
  await next();
  console.log( 'Downstream' );
})
```

### .on( `String event`, `Function callback` )

Attaches a callback to an event.

The callback is fired after any middleware that are attached to the instance and is called with the `ctx` object and the `data` that triggered the event. The `data` can also be found on the `ctx`, the only potential difference is that `data` is the raw `data` emitted with the event trigger whilst `ctx.data` could have been mutated within the middleware stack.

```js
io.on( 'message', ( ctx, data ) => {
  console.log( data );
  console.log( ctx.data, data );
});
```

### .off( `String event`, `Function callback` )

Removes a callback from an event.

If the `event` is omitted then it will remove all listeners from the instance.

If the `callback` is omitted then all callbacks for the supplied event will be removed.

```js
io.off( 'message', onChat );
io.off( 'message' );
io.off();
```

### .broadcast.emit( `String event`, `data` )

Sends a message to all connections.


### .to( `String room` ).emit( `String event`, `data` )

Sends data to all connections in a room.

```js
io.to( 'some_room' ).emit( 'message', { hello: 'world' } );
```


### .adapter( `Object adapter` )

```js
const redis = require('socket.io-redis');
io.adapter(redis({ host: 'localhost', port: 6379 }));
```


## Socket Connection API

### .rooms

A list of rooms that this connection is associated with.

```js
io.on( 'message', ( ctx, data ) => {
  console.log(ctx.socket.rooms);
});
```


### .join( `String room` )

Associates the connection with a room.

```js
io.on( 'message', ( ctx, data ) => {
  ctx.socket.join('some_room');
});
```


### .leave( `String room` )

Disassociates the connection with a room.

```js
io.on( 'message', ( ctx, data ) => {
  ctx.socket.leave( 'some_room' );
});
```


### .broadcast.emit( `String event`, `data` )

Sends a message to all active connections except the current connection.

```js
io.on( 'message', ( ctx, data ) => {
  ctx.socket.broadcast.emit( 'message', { hello: 'world' } );
});
```


### .broadcast.to(`String room`).emit( `String event`, `data` )

Sends a message to all active connections in a room except the current connection.

```js
io.on( 'message', ( ctx, data ) => {
  ctx.socket.broadcast.to('some_room').emit( 'message', { hello: 'world' } );
});
```


### .volatile.emit( `String event`, `data` )

Sends a message without ensuring delivery.

```js
io.on( 'message', ( ctx, data ) => {
  ctx.socket.volatile.emit( 'message', { hello: 'world' } );
});
```


### .compress(true).emit( `String event`, `data` )

Activates per-message compression.

```js
io.on( 'message', ( ctx, data ) => {
  ctx.socket.compress(true).emit( 'message', { hello: 'world' } );
});
```


## Running tests

```sh
npm test
```


## Maintainer/Contributor

- [Aaron Belovsky](https://github.com/ambelovsky)
- [Jonas Lieb](https://github.com/jojonas)


## Original Author

- [Matt Styles](https://github.com/mattstyles)


## License

MIT
