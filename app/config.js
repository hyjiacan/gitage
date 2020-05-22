const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '../')

const HOST = '0.0.0.0'
const PORT = 1997
const PROJECT_ROOT = 'projects'
const LOG_PATH = 'logs'
const CONFIG_FILE = 'pages.config.json'

if (!fs.existsSync(root)) {
  fs.mkdirSync(root, {recursive: true, mode: '777'})
}

module.exports = {
  root: path.resolve(root),
  projectRoot: path.resolve(path.join(root, PROJECT_ROOT)),
  logPath: path.resolve(path.join(root, LOG_PATH)),
  logLevel: 'info',
  host: HOST,
  port: PORT,
  configFile: CONFIG_FILE
}
