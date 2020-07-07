const fs = require('fs')
const os = require('os')
const path = require('path')
const pkg = require('../package.json')

const root = process.env.NODE_ENV === 'production' ? __dirname : path.resolve(path.join(__dirname, '..'))

const tempRoot = path.join(os.tmpdir(), pkg.name)

const OPTIONS = {
  ROOT: root,
  APP_NAME: 'Git Pages',
  HOST: '0.0.0.0',
  PORT: 1997,
  PROJECT_ROOT_PATH: 'projects',
  PROJECT_ROOT_URL: 'projects',
  PROJECT_CHECKOUT_TMP: tempRoot,
  LOG_PATH: 'logs',
  CONFIG_FILE: 'pages.config.json',
  DEBUG: process.env.NODE_ENV !== 'production'
}

function readConfigFile() {
  const f = path.join(root, 'config')
  if (!fs.existsSync(f)) {
    return
  }

  const content = fs.readFileSync(f, {encoding: 'utf-8', flag: 'r'}).toString()
  content.split('\n').forEach(line => {
    if (line.trim()[0] === '#') {
      return
    }
    const match = /^\s*(?<name>[^=]+)\s*=\s*(?<value>[\S]+)/.exec(line)
    if (!match) {
      return
    }
    const name = match.groups.name.trim()
    let value = match.groups.value.trim()

    if (!name || !value) {
      return
    }

    if (typeof OPTIONS[name] === 'number') {
      value = parseInt(value)
    } else if (typeof OPTIONS[name] === 'boolean') {
      value = value === 'true'
    }
    OPTIONS[name] = value
  })
}

// 读取配置文件
readConfigFile()

if (!fs.existsSync(root)) {
  fs.mkdirSync(root, {recursive: true, mode: '777'})
}

const options = {
  appName: OPTIONS.APP_NAME,
  root: OPTIONS.ROOT,
  projectTemp: path.isAbsolute(OPTIONS.PROJECT_CHECKOUT_TMP) ? path.resolve(OPTIONS.PROJECT_CHECKOUT_TMP) : path.resolve(path.join(root, OPTIONS.PROJECT_CHECKOUT_TMP)),
  projectRoot: path.isAbsolute(OPTIONS.PROJECT_ROOT_PATH) ? path.resolve(OPTIONS.PROJECT_ROOT_PATH) : path.resolve(path.join(root, OPTIONS.PROJECT_ROOT_PATH)),
  projectUrl: OPTIONS.PROJECT_ROOT_URL,
  logPath: path.isAbsolute(OPTIONS.LOG_PATH) ? path.resolve(OPTIONS.LOG_PATH) : path.resolve(path.join(root, OPTIONS.LOG_PATH)),
  logLevel: 'info',
  host: OPTIONS.HOST,
  port: OPTIONS.PORT,
  configFile: OPTIONS.CONFIG_FILE,
  debug: OPTIONS.DEBUG
}

console.info('----------------GIT-PAGES----------------')
console.info('%s@%s by %s', pkg.name, pkg.version, pkg.author)
console.info('-----------------------------------------')
for (const name in options) {
  console.info('%s: %s', name, options[name])
}
console.info('-----------------------------------------')

module.exports = options
