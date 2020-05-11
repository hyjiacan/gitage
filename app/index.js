const server = require('./server')
const config = require('./config')


server.start(config.port, config.host)
