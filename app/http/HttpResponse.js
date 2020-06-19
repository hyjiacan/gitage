const path = require('path')
const fs = require('fs')

const logger = require('../misc/logger')
const jst = require('../../externals/jst')
const config = require('../config')

const jstPkg = require('../../externals/jst/package.json')
const pkg = require('../../package.json')

class HttpResponse {
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
    if (typeof content === 'string' || content instanceof Buffer) {
      this._content = content
      if (contentType) {
        this._headers['content-type'] = contentType.startsWith('text/') ? `${contentType};charset=utf8` : contentType
      }
      return
    }
    // JSON
    this._content = JSON.stringify(content)
    if (contentType) {
      this._headers['content-type'] = contentType.startsWith('text/') ? `${contentType};charset=utf8` : contentType
    } else {
      this._headers['content-type'] = 'application/json'
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
    const templateFilePath = path.join(config.root, 'templates', templateFile)
    if (!fs.existsSync(templateFilePath)) {
      await this.serverError(`Template not exists: ${templateFile}`)
      return
    }
    try {
      const html = await jst.render(templateFilePath, {
        $jst: jstPkg,
        $pages: pkg,
        ...context
      }, {
        cache: !config.debug
      })

      this.write(html, 'text/html')
    } catch (e) {
      logger.error(e)
      await this.serverError(e)
    }
  }

  /**
   *
   * @param {Error|string} err
   */
  async serverError(err) {
    this._code = 500
    // if (err instanceof Error) {
    //   this._content = err.stack
    // } else {
    //   this._content = err
    // }
    try {
      let message = err instanceof Error ? err.stack : err
      message = message
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      await this.render('500.html', {
        message
      })
    } catch (e) {
      logger.error(e)
      this._content = e.message
    }
  }

  /**
   *
   * @param message
   */
  badRequest(message) {
    this._code = 400
    this._content = message || ''
  }

  notAllowed(message) {
    this._code = 405
    this._content = message || ''
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
