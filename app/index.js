const server = require('./server')
const config = require('./config')
const logger = require('./misc/logger')

process.on('uncaughtException', e => {
  logger.error(e)
})

server.start(config.port, config.host)
