const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')

const config = require('./config')

const MIME = require('./assets/mime')

const PROJECT_ROOT_MAP = {}

function renderIndex(res) {
  // 查找项目目录
  const items = fs.readdirSync(config.root)

  const projects = items.map(item => {
    return `<li><a href="${item}">${item}</a></li>`
  })


  const html = `<!doctype html>
<html>
<header>
<title>Index</title>
</header>
<body>
<h2>Index</h2>
<ul>
${projects.join('\n')}
</ul>
</body>
</html> 
  `
  res.write(html)
  res.end()
}

function readFileContent(fileName) {
  return fs.readFileSync(fileName, {
    encoding: 'utf-8',
    flag: 'r'
  })
}

function readFile(fileName) {
  return fs.readFileSync(fileName, {
    flag: 'r'
  })
}

function renderProjectIndex(res, projectName) {
  const projectPath = path.join(config.root, projectName)

  if (!checkPath(res, projectPath)) {
    return
  }

  // 读取配置文件
  const pageConfig = JSON.parse(readFileContent(path.join(projectPath, config.configFile)))

  PROJECT_ROOT_MAP[projectName] = path.join(projectPath, pageConfig.path)

  const indexFile = path.join(projectPath, pageConfig.path, pageConfig.index)

  const content = readFile(indexFile)
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': content.length
  })
  res.write(content)
  res.end()
}

function renderStaticResource(res, filePath) {
  if (!checkPath(res, filePath)) {
    return
  }
  const ext = path.extname(filePath)
  const mime = MIME[ext] || 'application/octet-stream'
  const content = readFile(filePath)
  res.writeHead(200, {
    'Content-Type': mime
  })
  res.write(content)
  res.end()
}

function checkPath(res, pathName) {
  if (fs.existsSync(pathName)) {
    return true
  }
  console.info('Path not found:', pathName)
  res.writeHead(404)
  res.end()
  return false
}

function handleGitHooks(req, res) {

}

const server = http.createServer((req, res) => {
  const reqPath = url.parse(req.url).path.replace(/^\//, '')

  if (reqPath === '') {
    renderIndex(res)
    return
  }

  if (reqPath.startsWith('api/hooks')) {
    // 接收 git 钩子
    handleGitHooks(req, res)
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
    renderProjectIndex(res, project)
    return
  }

  const targetPath = path.join(PROJECT_ROOT_MAP[project], filePath)

  renderStaticResource(res, targetPath)
})

server.listen(config.port, config.host)

console.info('Pages running on http://%s:%d', config.host, config.port)
