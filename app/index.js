const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')
const child_process = require('child_process')

const config = require('./config')

const MIME = require('./assets/mime')
const util = require('util')

const PROJECT_ROOT_MAP = {}

function renderIndex(res) {
  // 查找项目目录
  const items = fs.readdirSync(config.root)

  const projects = items.map(projectName => {
    const projectPath = path.join(config.root, projectName)

    if (!fs.statSync(projectPath).isDirectory()) {
      return
    }
    const pkgFile = path.join(projectPath, 'package.json')

    const pkg = JSON.parse(readFileContent(pkgFile))

    let repoUrl
    if (typeof pkg.repository === 'string') {
      repoUrl = pkg.repository
    } else {
      repoUrl = pkg.repository.url
    }

    return `<li>
  <div>
    <h3>${projectName}
      <small style="font-size: 14px">
        <span style="background-color: #5f6371; color: #ffffff;padding: 2px 5px;margin: 0 5px;">${pkg.name}@${pkg.version}</span>
        <a href="${repoUrl}">Repository</a> |
        <a href="${projectName}/">Page</a>
      </small>
    </h3>
  </div>
  <div style="color: #666;">${pkg.description || ''}</div>
</li>`
  })


  const html = `<!doctype html>
<html>
<head>
<title>Git pages</title>
<meta charset="UTF-8" />
</head>
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

  PROJECT_ROOT_MAP[projectName] = path.join(projectPath, pageConfig.path || 'docs')

  const indexFile = path.join(projectPath, pageConfig.path, pageConfig.index || 'index.html')

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

function receivePostData(req) {
  return new Promise(resolve => {
    let buffer = []
    req.on('data', chunk => {
      buffer.push(chunk)
    })

    req.on('end', () => {
      const data = JSON.parse(Buffer.concat(buffer).toString())
      resolve(data)
    })
  })
}

/**
 *
 * @param {IncomingMessage} req
 * @param res
 * @see https://docs.gitea.io/en-us/webhooks/
 */
async function handleGitHooks(req, res) {
  // TODO 暂时只处理 push 事件
  // const hash = req.headers['x-github-delivery']
  // X-github-Event: push
  // const event = req.headers['x-github-event'] ||
  //   req.headers['x-gitee-event'] ||
  //   req.headers['x-gogs-event'] ||
  //   req.headers['x-gitea-event'] ||
  //   req.headers['x-gitlab-event']

  const event = req.headers['x-gitea-event']

  if (!event) {
    console.info('Currently only accepts hook request from GITEA')
    res.writeHead(200)
    res.end()
    return
  }

  if (event !== 'push') {
    console.info('Currently only accepts PUSH method')
    res.writeHead(200)
    res.end()
    return
  }

  const {repository} = await receivePostData(req)
  const name = repository.name
  const cloneUrl = repository.clone_url

  const checkoutPath = path.join(config.root, name)
  await checkoutRepo(cloneUrl, checkoutPath)

  res.writeHead(200)
  res.end()
  res.end()
}

async function checkoutRepo(url, dist) {
  console.info('Checkout: %s', url)

  // # remove any untracked files and directories
  // git --work-tree=${WEB_DIR} clean -fd
  //
  // # force checkout of the latest deploy
  // git --work-tree=${WEB_DIR} checkout --force

  if (fs.existsSync(dist)) {
    // 清空工作目录
    // await runCommand(`git clean -f -d "${dist}"`)
    console.info('rmdir: %s', dist)
    fs.rmdirSync(dist, {recursive: true})
  }
  console.info('mkdir: %s', dist)
  fs.mkdirSync(dist, {recursive: true, mode: '777'})

  // 克隆代码
  await runCommand(`git clone --verbose --depth=1 ${url} "${dist}"`)
}

async function runCommand(cmd) {
  console.info('Spawn: %s', cmd)
  const {stdout, stderr} = await util.promisify(child_process.exec)(cmd, {
    windowsHide: true
  })

  console.info(stdout)
  if (stderr) {
    console.error(stderr)
  }
  console.info('Clone complete')
}

const server = http.createServer((req, res) => {
  const reqPath = url.parse(req.url).path.replace(/^\//, '')

  if (reqPath === '') {
    renderIndex(res)
    return
  }

  if (reqPath.startsWith('api/hooks')) {
    // 接收 git 钩子
    handleGitHooks(req, res).catch(e => {
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
    renderProjectIndex(res, project)
    return
  }

  const targetPath = path.join(PROJECT_ROOT_MAP[project], filePath)

  renderStaticResource(res, targetPath)
})

server.listen(config.port, config.host)

console.info('Git pages running on http://%s:%d', config.host, config.port)
