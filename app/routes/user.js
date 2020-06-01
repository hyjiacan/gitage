const path = require('path')

const config = require('../config')

const util = require('../misc/util')
const project = require('./project')

module.exports = {
  async index(req, res) {
    const userPath = path.join(config.projectRoot, req.params.user)

    if (!util.checkPath(res, userPath)) {
      return
    }

    // 读取项目列表
    const projects = await project.read(userPath)
    await res.render('index.html', {
      title: `${config.appName} @${req.params.user}`,
      projects
    })
  }
}
