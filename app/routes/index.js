const path = require('path')
const config = require('../config')
const project = require('./project')
const util = require('../misc/util')

module.exports = {
  async render(req, res) {
    const users = await util.readDir(config.projectRoot)
    let projectCount = 0

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const userPath = path.join(config.projectRoot, user)
      const projects = await util.readDir(userPath)
      projectCount += projects.length
    }

    await res.render('index.html', {
      userCount: users.length,
      projectCount
    })
  },
  async projects(req, res) {
    // 查找项目目录
    const items = await util.readDir(config.projectRoot)

    const projects = []

    for (const user of items) {
      const userPath = path.join(config.projectRoot, user)
      const ps = await project.read(userPath)
      projects.push(...ps)
    }

    await res.render('project.html', {
      projects
    })
  }
}
