var http = require('http')
  , WebSocket = require('websocket')

module.exports = function (opts) {
  var king = new(require('events').EventEmitter)
    , serverMode = false
    , httpServer
    , server
    , client
    , conn

  king.send = function(msg, callback) {
    serverMode
      ? server.broadcastUTF(msg)
      : conn.sendUTF(msg)
  }
  king.receive = function (callback) {
    king.on('message', function (msg) {
      callback(msg)
    })
  }

  function log () {
    opts.debug && console.log.apply(this, arguments)
  }

  ;(function connect () {
    serverMode = !serverMode

    function errorHandler (err) {
      opts.debug > 1 && log('%s', err)
      connect()
    }

    // Server mode
    if (serverMode) {
      opts.debug > 1 && log('\033[90mconnecting as \033[33mking\033[39m')
      httpServer = http.createServer()
      httpServer.on('error', errorHandler)
      httpServer.listen(opts.port, opts.host, function () {      
        server = new WebSocket.server({
          httpServer: httpServer
        , autoAcceptConnections: true
        })
        server.on('error', errorHandler)
        server.on('connect', function (c) {
          opts.debug > 1 && log('\033[90mconnected: \033[37m%s', server.connections.length)
          conn = c
          conn.on('message', function (msg) {
            server.connections.forEach(function (conn) {
              if (conn !== c) conn.sendUTF(msg.utf8Data)
            })
            king.emit('message', msg.utf8Data)
          })
          conn.on('close', function (c) {
            log('slave %s disconnected', conn.remoteAddress)
          })
        })
        log('\033[33mconnected as king')
        king.emit('connect', king)
      })
    } 

    // Client mode   
    else {
      opts.debug > 1 && log('\033[90mconnecting as \033[37mslave\033[39m')
      client = new WebSocket.client()
      client.on('connectFailed', errorHandler)
      client.on('connect', function (c) {
        conn = c
        conn.on('error', errorHandler)
        conn.on('close', errorHandler)
        conn.on('message', function (msg) {
          king.emit('message', msg.utf8Data)
        })
        opts.debug > 1 && log('\033[90mconnected as \033[37mslave\033[39m')
        king.emit('connect', king)
      })
      client.connect('ws://' + opts.host + ':' + opts.port)
    }
  }())
  return king
}