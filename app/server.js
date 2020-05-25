const http = require('http')
const fs = require('fs')
const url = require('url')
const path = require('path')

const indexPage = require('./renderers/index')
const gitHook = require('./githook')
const project = require('./renderers/project')
const logger = require('./misc/logger')
const config = require('./config')
const util = require('./misc/util')
const jst = require('./externals/jst')

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
      logger.error(e)
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

async function renderTemplate(templateFile, context) {
  const templateFilePath = path.join(config.root, 'app', 'templates', templateFile)
  if (!fs.existsSync(templateFilePath)) {
    console.info(templateFilePath)
    this.response.writeHead(500)
    this.response.write(`Template not exists: ${templateFile}`)
    this.response.end()
    return
  }
  const templateContent = util.readFileContent(templateFilePath)
  const html = await jst.render(templateContent, {
    $appName: config.appName,
    ...context
  })

  this.response.writeHead(200, {'content-type': 'text/html'})
  this.response.write(html)
  this.response.end()
}

const server = http.createServer((req, res) => {
  try {
    res.render = renderTemplate.bind({request: req, response: res})
    requestHandler(req, res)
  } catch (e) {
    logger.error(e)
    res.writeHead(500)
    res.write(e.message)
    res.end()
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
