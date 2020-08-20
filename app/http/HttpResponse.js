const path = require('path')
const fs = require('fs')

const logger = require('../misc/logger')
const wet = require('@hyjiacan/wet')
const enginePkg = require('@hyjiacan/wet/package.json')
const config = require('../config')

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
    this._headers = Object.create(null)
    this._code = 200
  }

  get request() {
    return this._req
  }

  get response() {
    return this._res
  }

  header(key, value) {
    this._headers[key] = value
  }

  write(content, contentType) {
    if (contentType) {
      this._headers['Content-Type'] = contentType.startsWith('text/') ? `${contentType};charset=utf8` : contentType
    }
    if (typeof content === 'string' || content instanceof Buffer) {
      this._content = content
      return
    }
    // JSON
    this._content = JSON.stringify(content)
    if (!contentType) {
      this._headers['Content-Type'] = 'application/json'
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
    const templateFilePath = path.join(config.webRoot, 'templates', templateFile)
    if (!fs.existsSync(templateFilePath)) {
      await this.serverError(`Template not exists: ${templateFile}`)
      return
    }
    try {
      const html = await wet.render(templateFilePath, {
        $tpl: enginePkg,
        $engine: pkg,
        $config: config,
        ...context
      }, {
        cache: !config.debug
      })

      this.write(html, 'text/html')
    } catch (e) {
      logger.error(e)
      // 避免模板错误时，其内的表达式和标签在500页面中被解析执行
      await this.serverError(e.message
        .replace(/{{/g, '{!{').replace(/}}/g, '}!}')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      )
    }
  }

  /**
   *
   * @param {Error|string} err
   */
  async serverError(err) {
    this._code = 500
    try {
      let message = err instanceof Error ? err.stack : err
      await this.render('server/500.html', {
        message: message
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
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

  async notAvailable(message) {
    this._code = 503
    await this.render('server/503.html', {
      message
    })
  }

  flush() {
    this._res.writeHead(this._code, this._headers)
    if (this._content) {
      this._headers['Content-Length'] = this._content.length
      this._res.write(this._content)
    }
    this._res.end()
  }
}

module.exports = HttpResponse
