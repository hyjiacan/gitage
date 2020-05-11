const http = require('http')
const url = require('url')

const indexPage = require('./renderers/indexpage')
const gitHook = require('./githook')

const server = http.createServer((req, res) => {
  const reqPath = url.parse(req.url).path.replace(/^\//, '')

  if (reqPath === '') {
    indexPage.render(res)
    return
  }

  if (reqPath.startsWith('api/hooks')) {
    // 接收 git 钩子
    gitHook.handle(req, res).catch(e => {
      console.error(e)
      res.writeHead(500)
      res.write(e.message)
      res.end()
    })
    return
  }

  const temp = reqPath.split('/')

  const project = temp.shift()
  const filePath = temp.join('/')

  if (filePath === '') {
    if (!reqPath.endsWith('/')) {
      res.writeHead(301, {
        Location: `${reqPath}/`
      })
      res.end()
      return
    }
    project.renderIndex(res, project)
    return
  }

  const targetPath = path.join(PROJECT_ROOT_MAP[project], filePath)

  project.getStatic(res, targetPath)
})

module.exports = {
  start(port, host) {
    server.listen(port, host)
    console.info('Git pages running on http://%s:%d', host, port)
  }
}
