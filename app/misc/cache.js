const fs = require('fs')
const path = require('path')
const config = require('../config')
const util = require('../misc/util')

const cachePath = config.cachePath

function getCacheFileName(type, name) {
  return path.join(cachePath, encodeURIComponent(type), encodeURIComponent(name))
}

module.exports = {
  /**
   *
   * @param {string} type
   * @param {string} name
   * @param {function} defaultValueGetter
   * @return {Promise<any>}
   */
  async get(type, name, defaultValueGetter) {
    const filename = getCacheFileName(type, name)
    if (fs.existsSync(filename)) {
      return util.readFileContent(filename, true)
    }
    const result = await defaultValueGetter()
    await this.set(type, name, result)
    return result
  },
  async set(type, name, content) {
    await util.writeFile(getCacheFileName(type, name), JSON.stringify(content))
  },
  remove(type, name) {
    const filename = getCacheFileName(type, name)
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename)
    }
  },
  clear() {
    if (fs.existsSync(cachePath)) {
      fs.rmdirSync(cachePath, {recursive: true})
    }
  }
}
