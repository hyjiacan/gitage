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

    return `<li>
  <div>
    <h3>${projectName}
      <small style="font-size: 14px">
        <span style="background-color: #5f6371; color: #ffffff;padding: 2px 5px;margin: 0 5px;">${pkg.name}@${pkg.version}</span>
        <a href="${repoUrl}">Repository</a> |
        <a href="${projectName}/">Page</a>
      </small>
    </h3>
  </div>
  <div style="color: #666;">${pkg.description || ''}</div>
</li>`
  })


  const html = `<!doctype html>
<html>
<head>
<title>Git pages</title>
<meta charset="UTF-8" />
</head>
<body>
<h2>Index</h2>
<ul>
${projects.join('\n')}
</ul>
</body>
</html> 
  `
  res.write(html)
  res.end()
}

module.exports = {
  render: renderIndex
}
