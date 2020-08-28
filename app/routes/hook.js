const logger = require('../misc/logger')
const deploy = require('../misc/deploy')
const HttpClient = require('../http/HttpClient')

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

async function handleRequest(req, eventType) {
  const data = JSON.parse(req.body.toString())
  /**
   * @type {string} ref 操作名称（branch名称/tag名称）
   * @type {string} ref_type 操作类型（branch/tag）
   */
  const {ref, ref_type: type} = data
  const branch = ref.split('/')[2]

  const repoUrl = new URL(data.repository.html_url)

  // 判断请求是否有效
  // 加载 gitage.config.json
  // 当文件不存在时返回 500
  const url = `${repoUrl.origin}/api/v1/repos/${data.repository.full_name}/contents/gitage.config.json?ref=${data.before}`
  try {
    logger.debug(`Loading gitage.config.json from remote repo.`)
    // 得到的是 base64
    const response = await HttpClient.get(url)
    logger.debug('Load complete')
    const content = Buffer.from(JSON.parse(response.toString()).content, 'base64').toString()
    const pageConfig = JSON.parse(content)
    if (pageConfig.tag) {
      if (type !== 'tag' || eventType !== 'create') {
        return 'Ignore: not a tag'
      }
    }
    if (pageConfig.branch) {
      if (branch !== pageConfig.branch) {
        return `Ignore: branch ${branch} is not expected`
      }
    }
  } catch (e) {
    logger.warn(e.message)
  }
  // 此操作可能在耗时较长
  // 为避免git端收到 timeout 的响应
  // checkout 前就将其返回
  deploy.checkout(data)
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

    // value 可能的值
    // push: 任意的 push 事件
    // release: 发布版本 (release)
    // create: 创建 tag 或 branch
    const {host, value: eventType} = event

    if (eventType !== 'push' && eventType !== 'create') {
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

    logger.debug(`Accept git push from ${host}: ${delivery.value}`)

    try {
      await handleRequest(req, eventType)

      res.write({
        code: 'OK'
      })
    } catch (e) {
      logger.error(e)

      res.write({
        code: 'FAIL',
        message: e.message
      })
    }
  }
}
