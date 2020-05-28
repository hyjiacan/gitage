const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const util = require('util')
const logger = require('./logger')

module.exports = {
  /**
   *
   * @param fileName
   * @return {String}
   */
  readFileContent(fileName) {
    return fs.readFileSync(fileName, {
      flag: 'r'
    }).toString('utf-8')
  },

  readFile(fileName) {
    return fs.readFileSync(fileName, {
      flag: 'r'
    })
  },

  /**
   * 读取目录
   * @param targetPath
   * @param {function} dirHandler 用于处理每个目录，返回值将作为每个目录的读取结果
   * @return {[]}
   */
  readDir(targetPath, dirHandler) {
    const dirs = []
    fs.readdirSync(targetPath).forEach(dirName => {
      // 隐藏目录，不需要
      if (dirName.startsWith('.')) {
        return
      }
      const dirPath = path.join(targetPath, dirName)

      if (!fs.statSync(dirPath).isDirectory()) {
        return
      }
      dirs.push(dirHandler(dirPath))
    })
    return dirs
  },

  writeFile(filename, content) {
    if (typeof content === 'object') {
      content = JSON.stringify(content, null, 2)
    }
    fs.writeFileSync(filename, content, {encoding: 'utf-8'})
  },

  checkPath(res, pathName) {
    if (fs.existsSync(pathName)) {
      return true
    }
    logger.info(`Path not found: ${pathName}`)
    res.writeHead(404)
    res.end()
    return false
  },

  async runCommand(cmd, workingDir) {
    logger.info(`exec: ${cmd}`)
    const {stdout, stderr} = await util.promisify(child_process.exec)(cmd, {
      windowsHide: true,
      cwd: workingDir
    })

    logger.debug(stdout)
    if (stderr) {
      logger.info(stderr)
    }
  },
  receivePostData(req) {
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
}
