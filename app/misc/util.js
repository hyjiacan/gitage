const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const child_process = require('child_process')
const util = require('util')
const logger = require('./logger')

module.exports = {
  /**
   *
   * @param fileName
   * @return {String}
   */
  async readFileContent(fileName) {
    const buffer = await util.promisify(fs.readFile)(fileName, {
      flag: 'r'
    })

    return buffer.toString('utf-8')
  },

  async readFile(fileName) {
    return util.promisify(fs.readFile)(fileName, {
      flag: 'r'
    })
  },

  /**
   * 读取目录
   * @param targetPath
   * @param isFile
   * @return {[]}
   */
  async readDir(targetPath, isFile = false) {
    const dirs = await this.readEntities(targetPath)
    return dirs.filter(dirName => {
      // 隐藏目录，不需要
      if (dirName.startsWith('.')) {
        return false
      }
      const dirPath = path.join(targetPath, dirName)
      const stat = fs.statSync(dirPath)
      return isFile ? stat.isFile() : stat.isDirectory()
    })
  },

  /**
   * 读取目录
   * @param targetPath
   * @return {[]}
   */
  async readEntities(targetPath) {
    const dirs = await util.promisify(fs.readdir)(targetPath)
    return dirs.filter(dirName => {
      // 隐藏目录，不需要
      return !dirName.startsWith('.')
    })
  },

  async writeFile(filename, content) {
    const dir = path.dirname(filename)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true, mode: '777'})
    }
    if (typeof content === 'object') {
      content = JSON.stringify(content, null, 2)
    }
    return util.promisify(fs.writeFile)(filename, content, {encoding: 'utf-8'})
  },

  checkPath(res, pathName) {
    if (fs.existsSync(pathName)) {
      return true
    }
    logger.info(`Path not found: ${pathName}`)
    res.notFound()
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
  async receivePostData(req) {
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
  },
  /**
   *
   * @param filename
   * @return {Promise<string>}
   */
  async getFileMd5(filename) {
    return new Promise(resolve => {
      const md5sum = crypto.createHash('md5')
      const stream = fs.createReadStream(filename)
      stream.on('data', chunk => {
        md5sum.update(chunk)
      })
      stream.on('end', () => {
        const md5 = md5sum.digest('hex')
        resolve(md5)
      })
    })
  }
}
