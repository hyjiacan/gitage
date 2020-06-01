const server = require('./server')
const config = require('./config')
const logger = require('./misc/logger')
const deploy = require('./misc/deploy')
const router = require('./router')
const pathmap = require('./routes/pathmap')


process.on('uncaughtException', e => {
  logger.error(e)
})

// 初始化
deploy.clearFlag()

pathmap.map(router)

server.start(config.port, config.host)
