const pkg = require('../package.json')
const config = require('./config')
const server = require('./server')
const logger = require('./misc/logger')
const deploy = require('./misc/deploy')
const router = require('./router')
const pathmap = require('./routes/pathmap')
const cache = require('./misc/cache')
const customHandlers = require('./http/handlers')
const handlers = require('./http-handlers')

process.on('uncaughtException', e => {
  logger.error(e)
})

const splitter = '----------------GITAGE----------------'

console.info(splitter)
console.info('%s@%s by %s', pkg.name, pkg.version, pkg.author)
console.info(splitter)
for (const name in config) {
  console.info('%s: %s', name, config[name])
}
console.info(splitter)

// 初始化
deploy.clearFlag()
cache.clear()

pathmap.map(router)

console.info('Load http handlers')
handlers.forEach(({test, handler}) => {
  customHandlers.register(test, handler)
})
console.info('done')

server.start()
