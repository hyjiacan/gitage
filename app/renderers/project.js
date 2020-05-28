const fs = require('fs')
const path = require('path')

const config = require('../config')

const MIME = require('../assets/mime')
const util = require('../misc/util')
const deploy = require('../misc/deploy')

const PAGE_CONFIG_MAP = {}

// 读取配置文件
async function getPageConfig(userName, projectName) {
  const id = `${userName}/${projectName}`

  let conf = PAGE_CONFIG_MAP[id]
  if (conf) {
    return conf
  }

  const projectPath = path.join(config.projectRoot, userName, projectName)
  const configFile = path.join(projectPath, config.configFile)
  const pageConfig = fs.existsSync(configFile) ? JSON.parse(await util.readFileContent(configFile)) : {}
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
  async read(userPath) {
    const dirs = await util.readDir(userPath)
    const projects = []
    for (const dir of dirs) {
      const content = await util.readFileContent(path.join(userPath, dir, '.pages.push'))
      projects.push(JSON.parse(content))
    }
    return projects
  },
  async index(res, userName, projectName) {
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

    const conf = await getPageConfig(userName, projectName)
    const content = await util.readFile(conf.index)

    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': content.length
    })
    res.write(content)
    res.end()
  },

  async getStatic(res, userName, projectName, filePath) {
    const conf = await getPageConfig(userName, projectName)
    filePath = path.join(conf.root, filePath)
    if (!util.checkPath(res, filePath)) {
      return
    }
    const ext = path.extname(filePath)
    const mime = MIME[ext] || 'application/octet-stream'
    const content = await util.readFile(filePath)
    res.writeHead(200, {
      'Content-Type': mime,
      'content-length': content.length
    })
    res.write(content)
    res.end()
  }
}
