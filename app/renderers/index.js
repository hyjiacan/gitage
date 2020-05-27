const fs = require('fs')
const path = require('path')
const config = require('../config')
const util = require('../misc/util')
const project = require('./project')

function renderIndex(res) {
  // 查找项目目录
  const items = fs.readdirSync(config.projectRoot)

  const projects = []

  items.forEach(userName => {
    // 隐藏目录，不需要
    if (userName.startsWith('.')) {
      return
    }
    // 用户目录
    const userPath = path.join(config.projectRoot, userName)

    if (!fs.statSync(userPath).isDirectory()) {
      return
    }

    projects.push(...project.read(userPath))
  })

  res.render('index.html', {
    title: config.appName,
    projects
  })
}

module.exports = {
  render: renderIndex
}
