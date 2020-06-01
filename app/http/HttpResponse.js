const path = require('path')
const fs = require('fs')

const logger = require('../misc/logger')
const jst = require('../../externals/jst')
const util = require('../misc/util')
const config = require('../config')

class HttpResponse {
  _req
  _res
  _content
  _code
  _headers

  /**
   *
   * @param {IncomingMessage} request
   * @param {ServerResponse} response
   */
  constructor(request, response) {
    this._req = request
    this._res = response
    this._headers = {}
    this._code = 200
  }

  get request() {
    return this._req
  }

  get response() {
    return this._res
  }

  write(content, contentType) {
    this._content = content
    if (contentType) {
      this._headers['content-type'] = contentType
    }
  }

  redirect(url) {
    this._code = 301
    this._headers.location = url
  }

  notFound() {
    this._code = 404
  }

  async render(templateFile, context) {
    const templateFilePath = path.join(config.root, 'app', 'templates', templateFile)
    if (!fs.existsSync(templateFilePath)) {
      this.serverError(`Template not exists: ${templateFile}`)
      return
    }
    try {
      const templateContent = await util.readFileContent(templateFilePath)
      const html = await jst.render(templateContent, context, {
        cache: !config.debug
      })

      this.write(html, 'text/html')
    } catch (e) {
      logger.error(e)
      this.serverError(e)
    }
  }

  /**
   *
   * @param {Error|string} err
   */
  serverError(err) {
    this._code = 500
    if (err instanceof Error) {
      this._content = err.stack
    } else {
      this._content = err
    }
  }

  flush() {
    this._res.writeHead(this._code, this._headers)
    if (this._content) {
      this._res.write(this._content)
    }
    this._res.end()
  }
}

module.exports = HttpResponse
