const http = require('http')

const logger = require('./misc/logger')
const router = require('./router')
const HttpRequest = require('./http/HttpRequest')
const HttpResponse = require('./http/HttpResponse')

/**
 * 允许的入口
 * /
 * /raw/ 项目内的原始文件
 * /projects/
 * /assets/ pages 的资产数据
 * @param req
 * @param res
 */
// function requestHandler(req, res) {
//   logger.debug(req.url)
//
//   const rawPath = url.parse(req.url).path
//   if (rawPath === '') {
//     redirect(res, rawPath)
//     return
//   }
//
//   if (rawPath === '/') {
//     // 渲染首页
//     if (req.method !== 'POST') {
//       indexPage.render(res)
//       logger.debug(`${rawPath}`)
//       return
//     }
//
//     // 接收 git 钩子
//     gitHook.handle(req, res).catch(e => {
//       logger.error(e)
//       res.writeHead(500)
//       res.write(e.message)
//       res.end()
//     })
//     return
//   }
//
//
//   // 移除请求开始部分的 / 符号
//   const reqPath = rawPath.replace(/^\//, '')
//   const temp = reqPath.split('/')
//
//   const userName = temp.shift()
//   const projectName = temp.shift()
//   let filePath = temp.join('/')
//
//   if (!projectName) {
//     // 渲染用户项目列表
//     user.index(res, userName)
//     return
//   }
//
//   if (!filePath) {
//     // 渲染项目页面
//     project.index(res, userName, projectName)
//     return
//   }
//
//   const projectPath = path.join(config.projectRoot, userName, projectName)
//   const abs = path.resolve(path.join(projectPath, filePath))
//   // 如果最后的绝对路径不是以 projectPath 开头，表示越权访问了
//   if (!abs.startsWith(projectPath)) {
//     res.writeHead(404)
//     res.end()
//     return
//   }
//
//   // 渲染 readme 文件
//   if (temp.length === 1 && /^readme/i.test(filePath)) {
//     project.readme(res, userName, projectName, filePath)
//     return
//   }
// }

const server = http.createServer(async (req, res) => {
  const request = new HttpRequest(req)
  const response = new HttpResponse(req, res)
  try {
    await router.route(request, response)
  } catch (e) {
    logger.error(e)
    response.serverError(e)
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
