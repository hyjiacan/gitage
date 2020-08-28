const HttpClient = require('../http/HttpClient')
const logger = require('../misc/logger')

module.exports.handle = async function (req, res) {
  // TODO 需要做请求检验，比如：target 不能为空
  const body = decodeURIComponent(req.body.toString())
  // 暂时认为只有一个参数 target
  const target = body.substr('target='.length)
  try {
    const data = await HttpClient.get(target)
    res.write(JSON.parse(data.toString()))
  } catch (e) {
    logger.warn(`${target}: ${e.message}`)
    res.notFound()
  }
}
