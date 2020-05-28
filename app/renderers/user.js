const path = require('path')

const config = require('../config')

const util = require('../misc/util')
const project = require('./project')

module.exports = {
  async index(res, userName) {
    const userPath = path.join(config.projectRoot, userName)

    if (!util.checkPath(res, userPath)) {
      return
    }

    // 读取项目列表
    const projects = await project.read(userPath)
    res.render('index.html', {
      title: `${config.appName} @${userName}`,
      projects
    })
  }
}
