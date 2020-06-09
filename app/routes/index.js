const fs = require('fs')
const path = require('path')
const config = require('../config')
const project = require('./project')

async function renderIndex(req, res) {
  if (req.path !== '/') {
    res.notFound()
    return
  }
  // 查找项目目录
  const items = fs.readdirSync(config.projectRoot)

  const projects = []

  for (const userName of items) {
    // 隐藏目录，不需要
    if (userName.startsWith('.')) {
      continue
    }
    // 用户目录
    const userPath = path.join(config.projectRoot, userName)

    if (!fs.statSync(userPath).isDirectory()) {
      continue
    }

    const ps = await project.read(userPath)
    projects.push(...ps)
  }

  await res.render('index.html', {
    title: config.appName,
    projects
  })
}

module.exports = {
  render: renderIndex
}
