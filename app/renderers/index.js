const fs = require('fs')
const path = require('path')
const config = require('../config')
const util = require('../misc/util')

function renderIndex(res) {
  // 查找项目目录
  const items = fs.readdirSync(config.projectRoot)

  const projects = items.map(projectName => {
    const projectPath = path.join(config.projectRoot, projectName)

    if (!fs.statSync(projectPath).isDirectory()) {
      return
    }
    const pkgFile = path.join(projectPath, 'package.json')

    const pkg = JSON.parse(util.readFileContent(pkgFile))

    let repoUrl
    if (typeof pkg.repository === 'string') {
      repoUrl = pkg.repository
    } else {
      repoUrl = pkg.repository.url
    }

    return {
      projectName,
      repoUrl,
      name: pkg.name,
      version: pkg.version,
      description: pkg.description || ''
    }
  })

  res.render('index.html', {
    projects
  })
}

module.exports = {
  render: renderIndex
}
