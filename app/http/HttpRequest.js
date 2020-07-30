const url = require('url')

function resolveQuery(url) {
  const query = {}
  if (!url.query) {
    return query
  }

  url.query.split('&').forEach(item => {
    if (!/=/.test(item)) {
      query[item] = true
      return
    }
    const {groups} = /^(?<name>[^=]+)(?<eq>=)(?<value>.+)?$/.exec(item)
    query[groups.name] = groups.value
  })

  return query
}

class HttpRequest {
  /**
   *
   * @param {IncomingMessage} request
   */
  constructor(request) {
    this._req = request
    this._method = request.method
    this._url = url.parse(request.url)

    this._query = resolveQuery(this._url)
  }

  get query() {
    return this._query
  }

  get raw() {
    return this._req
  }

  get url() {
    return this._url
  }

  get path() {
    return this._url.pathname
  }

  get method() {
    return this._method
  }

  get headers() {
    return this._req.headers
  }
}

module.exports = HttpRequest
