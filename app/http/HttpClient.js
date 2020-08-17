const http = require('http')
const https = require('https')

const pkg = require('../../package.json')

class HttpClient {
  constructor(url, options) {
    this.url = new URL(url)
    this.isHttps = this.url.protocol === 'https:'

    if (!options) {
      options = Object.create(null)
    }
    if (!options.headers) {
      options.headers = Object.create(null)
    }

    this.options = {
      host: this.url.hostname,
      port: this.url.port,
      path: this.url.pathname,
      headers: {
        'user-agent': `${pkg.name}/${pkg.version}`,
        'accept-encoding': 'utf-8',
        ...options.headers
      }
    }
  }

  get http() {
    return this.isHttps ? https : http
  }

  async get() {
    return new Promise((resolve, reject) => {
      this.http.get(this.options, res => {
        if (res.statusCode !== 200) {
          reject(new Error(res.statusMessage))
        }
        let content
        res.on('data', data => {
          if (content) {
            content = Buffer.concat([content, data])
          } else {
            content = data
          }
        })

        res.on('end', () => {
          resolve(content)
        })

        res.on('error', err => {
          reject(err)
        })
      })
    })
  }

  /**
   *
   * @param url
   * @param options
   * @return {Promise<Buffer>}
   */
  static get(url, options) {
    return new HttpClient(url, options).get()
  }
}

module.exports = HttpClient
