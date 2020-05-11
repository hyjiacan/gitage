const path = require('path')

const config = require('../config')

const MIME = require('../assets/mime')
const util = require('../misc/util')

const PROJECT_ROOT_MAP = {}

module.exports = {
  renderIndex(res, projectName) {
    const projectPath = path.join(config.root, projectName)

    if (!util.checkPath(res, projectPath)) {
      return
    }

    // 读取配置文件
    const pageConfig = JSON.parse(util.readFileContent(path.join(projectPath, config.configFile)))

    PROJECT_ROOT_MAP[projectName] = path.join(projectPath, pageConfig.path || 'docs')

    const indexFile = path.join(projectPath, pageConfig.path, pageConfig.index || 'index.html')

    const content = util.readFile(indexFile)
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': content.length
    })
    res.write(content)
    res.end()
  },

  getStatic(res, filePath) {
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
