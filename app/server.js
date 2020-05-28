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
const jst = require('../externals/jst/src/engine')
const user = require('./renderers/user')

function requestHandler(req, res) {
  logger.debug(req.url)

  const rawPath = url.parse(req.url).path

  // 重定向，使请求始终以 / 结束
  if (!rawPath.endsWith('/')) {
    res.writeHead(301, {
      Location: `${rawPath}/`
    })
    res.end()
    return
  }

  // 移除请求开始部分的 / 符号
  const reqPath = rawPath.replace(/^\//, '')

  if (reqPath === '') {
    // 渲染首页
    if (req.method !== 'POST') {
      indexPage.render(res)
      logger.debug(`${reqPath}`)
      return
    }
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

  const userName = temp.shift()
  const projectName = temp.shift()
  let filePath = temp.join('/')

  if (!projectName) {
    // 渲染用户项目列表
    user.index(res, userName)
    return
  }

  if (!filePath) {
    // 渲染项目页面
    project.index(res, userName, projectName)
    return
  }

  const projectPath = path.join(config.projectRoot, userName, projectName)
  const abs = path.resolve(path.join(projectPath, filePath))
  // 如果最后的绝对路径不是以 projectPath 开头，表示越权访问了
  if (!abs.startsWith(projectPath)) {
    res.writeHead(404)
    res.end()
    return
  }

  // 响应静态资源
  project.getStatic(res, userName, projectName, filePath)
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
  const html = await jst.render(templateContent, context, {
    cache: !config.debug
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
