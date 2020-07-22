const path = require('path')
const config = require('../config')
const util = require('../misc/util')

const mimes = require('../assets/mime')

const static_root = path.join(config.webRoot, 'static')

module.exports = {
  async render(req, res) {
    const abs = path.resolve(path.join(config.webRoot, req.path))

    if (!abs.startsWith(static_root)) {
      res.notFound()
      return
    }

    if (!util.checkPath(res, abs)) {
      return
    }

    const content = await util.readFile(abs)
    const mime = mimes[path.extname(abs)] || 'application/octet-stream'

    res.write(content, mime)
  }
}
