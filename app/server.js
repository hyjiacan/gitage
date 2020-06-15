const http = require('http')

const logger = require('./misc/logger')
const router = require('./router')
const HttpRequest = require('./http/HttpRequest')
const HttpResponse = require('./http/HttpResponse')

const server = http.createServer(async (req, res) => {
  const request = new HttpRequest(req)
  const response = new HttpResponse(req, res)
  try {
    await router.route(request, response)
  } catch (e) {
    logger.error(e)
    await response.serverError(e)
  } finally {
    response.flush()
  }
})

server.on('error', e => {
  logger.error(e)
})

server.on('close', () => {
  logger.info('Server closed')
})

module.exports = {
  start(port, host) {
    server.listen(port, host)
    logger.info(`Git pages running on http://${host}:${port}`)
  }
}
