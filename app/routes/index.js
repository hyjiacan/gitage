const path = require('path')
const config = require('../config')
const project = require('./project')
const util = require('../misc/util')

module.exports = {
  async render(req, res) {
    const users = await util.readDir(config.projectRoot)
    const projects = []

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const userPath = path.join(config.projectRoot, user)
      const ps = await project.read(userPath)
      projects.push(...ps)
    }

    // 最近更新的项目 排序: repository.updated_at (top16)
    projects.sort((a, b) => {
      if (a.repository.updated_at > b.repository.updated_at) {
        return -1
      }
      return 1
    })

    const recentList = projects.slice(0, 16)

    await res.render('index.html', {
      userCount: users.length,
      projectCount: projects.length,
      recentList
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
