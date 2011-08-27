var options = {
  port: 4440
, host: 'localhost'
, debug: true
, nick: process.argv[2] || require('Faker').Name.firstName()
}

process.stdin.resume()
process.stdin.setEncoding('utf8')

require('./king')(options).once('connect', function (conn) {
  console.log('my nick is: %s', options.nick)
  console.log('connected to network')
  conn.receive(function (msg) {
    console.log(msg)
  })
  ;(function broadcast (data) {
    data = (data || '').split('\n')[0]
    if (data && data.trim().length) conn.send(options.nick + ': ' + data)
    process.stdin.once('data', broadcast)
  }())
})