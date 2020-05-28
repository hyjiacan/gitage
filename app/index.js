const server = require('./server')
const config = require('./config')
const logger = require('./misc/logger')
const deploy = require('./misc/deploy')

process.on('uncaughtException', e => {
  logger.error(e)
})

// 初始化
deploy.clearFlag()

server.start(config.port, config.host)
