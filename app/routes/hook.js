const path = require('path')
const util = require('../misc/util')
const config = require('../config')
const logger = require('../misc/logger')
const deploy = require('../misc/deploy')

const HOSTS = ['gitea', 'gogs', 'gitlab', 'github']

function getHeader(headers, suffix) {
  for (const host of HOSTS) {
    const key = `x-${host}-${suffix}`
    const value = headers[key]
    if (value) {
      return {
        host,
        value
      }
    }
  }
  return null
}

module.exports = {
  /**
   *
   * @param {HttpRequest} req
   * @param {HttpResponse} res
   * @see https://docs.gitea.io/en-us/webhooks/
   */
  async handle(req, res) {
    if (!/^post$/i.test(req.method)) {
      const msg = `Invalid request: method ${req.method} not allowed, accept POST only`
      logger.info(msg)
      res.notAllowed(msg)
      return
    }

    // TODO 暂时只处理 push 事件
    // X-github-Event: push
    const event = getHeader(req.headers, 'event')

    if (!event) {
      const msg = 'Invalid request: missing required header "x-[host]-event"'
      logger.info(msg)
      res.badRequest(msg)
      return
    }

    const {host, value} = event

    if (value !== 'push') {
      const msg = 'Currently accepts PUSH method only'
      logger.info(msg)
      res.write(msg)
      return
    }

    const delivery = getHeader(req.headers, 'delivery')

    if (!delivery) {
      const msg = 'Invalid request: missing required header "x-[host]-delivery"'
      logger.info(msg)
      res.badRequest(msg)
      return
    }

    logger.debug(`Accept git push from ${host}: ${delivery}`)

    const data = await util.receivePostData(req.raw)
    const {repository} = data
    const name = repository.name

    // 由用户名和项目名称组成
    const checkoutPath = path.join(config.projectRoot, repository.owner.username, name)
    await deploy.checkout(data, checkoutPath)

    res.write({
      code: 'OK'
    })
  }
}
