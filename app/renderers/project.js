const fs = require('fs')
const path = require('path')

const config = require('../config')

const MIME = require('../assets/mime')
const util = require('../misc/util')
const deploy = require('../misc/deploy')

const PAGE_CONFIG_MAP = {}

// 读取配置文件
function getPageConfig(userName, projectName) {
  const id = `${userName}/${projectName}`

  let conf = PAGE_CONFIG_MAP[id]
  if (conf) {
    return conf
  }

  const projectPath = path.join(config.projectRoot, userName, projectName)
  const configFile = path.join(projectPath, config.configFile)
  const pageConfig = fs.existsSync(configFile) ? JSON.parse(util.readFileContent(configFile)) : {}
  const pageRoot = PAGE_CONFIG_MAP[projectName] = path.join(projectPath, pageConfig.path || 'docs')
  const indexFile = path.join(pageRoot, pageConfig.index || 'index.html')

  conf = {
    index: indexFile,
    root: pageRoot
  }

  PAGE_CONFIG_MAP[id] = conf

  return conf
}

module.exports = {
  read(userPath) {
    return util.readDir(userPath, projectPath => {
      const content = util.readFileContent(path.join(projectPath, '.pages.push'))
      return JSON.parse(content)
    })
  },
  index(res, userName, projectName) {
    const projectPath = path.join(config.projectRoot, userName, projectName)

    if (!util.checkPath(res, projectPath)) {
      return
    }

    const fullName = `${userName}/${projectName}`

    if (deploy.isPending(fullName)) {
      res.writeHead(200, {'content-type': 'text/plain'})
      res.write(`Project ${fullName} is deploying, please waiting for a moment`)
      res.end()
      return
    }

    const conf = getPageConfig(userName, projectName)
    const content = util.readFile(conf.index)

    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': content.length
    })
    res.write(content)
    res.end()
  },

  getStatic(res, userName, projectName, filePath) {
    const conf = getPageConfig(userName, projectName)
    filePath = path.join(conf.root, filePath)
    if (!util.checkPath(res, filePath)) {
      return
    }
    const ext = path.extname(filePath)
    const mime = MIME[ext] || 'application/octet-stream'
    const content = util.readFile(filePath)
    res.writeHead(200, {
      'Content-Type': mime
    })
    res.write(content)
    res.end()
  }
}
