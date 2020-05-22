const fs = require('fs')
const util = require('./misc/util')
const config = require('./config')
const logger = require('./misc/logger')

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
    // const hash = req.headers['x-github-delivery']
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

    const {repository} = await util.receivePostData(req)
    const name = repository.name
    const cloneUrl = repository.clone_url

    const checkoutPath = path.join(config.projectRoot, name)
    await checkoutRepo(cloneUrl, checkoutPath)

    res.writeHead(200)
    res.end()
  },
  async checkoutRepo(url, dist) {
    logger.info(`Checkout: ${url}`)

    // # remove any untracked files and directories
    // git --work-tree=${WEB_DIR} clean -fd
    //
    // # force checkout of the latest deploy
    // git --work-tree=${WEB_DIR} checkout --force

    if (fs.existsSync(dist)) {
      // 清空工作目录
      // await runCommand(`git clean -f -d "${dist}"`)
      logger.info(`rmdir: ${dist}`)
      fs.rmdirSync(dist, {recursive: true})
    }
    logger.info(`mkdir: ${dist}`)
    fs.mkdirSync(dist, {recursive: true, mode: '777'})

    // 克隆代码
    await util.runCommand(`git clone --verbose --depth=1 ${url} "${dist}"`)
  }
}
