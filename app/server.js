const http = require('http')
const url = require('url')

const indexPage = require('./renderers/indexpage')
const gitHook = require('./githook')
const project = require('./renderers/project')
const logger = require('./misc/logger')

function requestHandler(req, res) {
  logger.debug(req.url)

  const reqPath = url.parse(req.url).path.replace(/^\//, '')

  if (reqPath === '') {
    indexPage.render(res)
    logger.debug(`${reqPath}`)
    return
  }

  if (reqPath.startsWith('api/hooks')) {
    // 接收 git 钩子
    gitHook.handle(req, res).catch(e => {
      logger.error(e.message)
      res.writeHead(500)
      res.write(e.message)
      res.end()
    })
    return
  }

  const temp = reqPath.split('/')

  const projectName = temp.shift()
  const filePath = temp.join('/')

  if (filePath === '') {
    if (!reqPath.endsWith('/')) {
      res.writeHead(301, {
        Location: `${reqPath}/`
      })
      res.end()
      return
    }
    project.renderIndex(res, projectName)
    return
  }

  project.getStatic(res, projectName, filePath)
}

const server = http.createServer((req, res) => {
  try {
    requestHandler(req, res)
  } catch (e) {
    logger.error(e.message)
    res.writeHead(500)
    res.write(e.message)
    res.end()
  }
})

server.on('error', e => {
  logger.error(e.message)
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
