const fs = require('fs')
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

  checkPath(res, pathName) {
    if (fs.existsSync(pathName)) {
      return true
    }
    logger.info(`Path not found: ${pathName}`)
    res.writeHead(404)
    res.end()
    return false
  },

  async runCommand(cmd) {
    logger.info(`Spawn: ${cmd}`)
    const {stdout, stderr} = await util.promisify(child_process.exec)(cmd, {
      windowsHide: true
    })

    logger.debug(stdout)
    if (stderr) {
      logger.info(stderr)
    }
    logger.debug('Clone complete')
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
