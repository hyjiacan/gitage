const url = require('url')

class HttpRequest {
  _req
  _url
  _method

  params = {}

  /**
   *
   * @param {IncomingMessage} request
   */
  constructor(request) {
    this._req = request
    this._method = request.method
    this._url = url.parse(request.url)
  }

  get raw() {
    return this._req
  }

  get url() {
    return this._url
  }

  get path() {
    return this._url.path
  }

  get method() {
    return this._method
  }
}

module.exports = HttpRequest
