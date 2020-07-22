const fs = require('fs')
const os = require('os')
const path = require('path')
const pkg = require('../package.json')

const root = process.env.NODE_ENV === 'production' ? __dirname : path.resolve(path.join(__dirname, '..'))

const tempRoot = path.join(os.tmpdir(), pkg.name)

const OPTIONS = {
  HOST: '0.0.0.0',
  PORT: 1997,
  PROJECT_ROOT_PATH: 'projects',
  PROJECT_ROOT_URL: 'projects',
  PROJECT_CHECKOUT_TMP: tempRoot,
  LOG_PATH: 'logs',
  LOG_LEVEL: 'info',
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
  name: 'Gitage',
  description: '基于GIT的静态WEB服务',
  configFile: 'gitage.config.json',
  pushFile: 'gitage.push.json',
  root: root,
  webRoot: path.join(root, 'web'),
  projectTemp: path.isAbsolute(OPTIONS.PROJECT_CHECKOUT_TMP) ? path.resolve(OPTIONS.PROJECT_CHECKOUT_TMP) : path.resolve(path.join(root, OPTIONS.PROJECT_CHECKOUT_TMP)),
  projectRoot: path.isAbsolute(OPTIONS.PROJECT_ROOT_PATH) ? path.resolve(OPTIONS.PROJECT_ROOT_PATH) : path.resolve(path.join(root, OPTIONS.PROJECT_ROOT_PATH)),
  projectUrl: OPTIONS.PROJECT_ROOT_URL,
  logPath: path.isAbsolute(OPTIONS.LOG_PATH) ? path.resolve(OPTIONS.LOG_PATH) : path.resolve(path.join(root, OPTIONS.LOG_PATH)),
  logLevel: OPTIONS.LOG_LEVEL,
  host: OPTIONS.HOST,
  port: OPTIONS.PORT,
  debug: OPTIONS.DEBUG
}

function createIfNotExists(thePath) {
  if (!fs.existsSync(thePath)) {
    fs.mkdirSync(thePath, {recursive: true})
  }
}

// 创建目录
createIfNotExists(options.projectTemp)
createIfNotExists(options.projectRoot)
createIfNotExists(options.logPath)

module.exports = options
