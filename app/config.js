const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '../projects')

if (!fs.existsSync(root)) {
  fs.mkdirSync(root, {recursive: true, mode: '777'})
}

module.exports = {
  root: path.resolve(root),
  host: '0.0.0.0',
  port: 1997,
  configFile: 'pages.config.json'
}
