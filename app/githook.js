const path = require('path')
const util = require('./misc/util')
const config = require('./config')
const logger = require('./misc/logger')
const deploy = require('./misc/deploy')

module.exports = {
  /**
   *
   * @param {IncomingMessage} req
   * @param res
   * @see https://docs.gitea.io/en-us/webhooks/
   */
  async handle(req, res) {
    // TODO 暂时只处理 push 事件
    // 应用中应该根据配置来判断是否需要重新部署
    // 同时应该将项目 clone 到临时目录，然后仅将
    // 部署目录放到指定的项目目录下
    const hash = req.headers['x-github-delivery']
    // X-github-Event: push
    // const event = req.headers['x-github-event'] ||
    //   req.headers['x-gitee-event'] ||
    //   req.headers['x-gogs-event'] ||
    //   req.headers['x-gitea-event'] ||
    //   req.headers['x-gitlab-event']

    const event = req.headers['x-gitea-event']

    if (!event) {
      logger.info('Currently only accepts hook request from GITEA')
      res.writeHead(200)
      res.end()
      return
    }

    if (event !== 'push') {
      logger.info('Currently only accepts PUSH method')
      res.writeHead(200)
      res.end()
      return
    }

    logger.debug(`Accept git push: ${hash}`)

    const data = await util.receivePostData(req)
    const {repository} = data
    const name = repository.name

    // 由用户名和项目名称组成
    const checkoutPath = path.join(config.projectRoot, repository.owner.username, name)
    await deploy.checkout(data, checkoutPath)

    res.writeHead(200, {'content-type': 'application/json'})
    res.write(JSON.stringify({
      code: 'OK'
    }))
    res.end()
  }
}
