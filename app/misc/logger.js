const fs = require('fs')
const path = require('path')

const config = require('../config')

const LEVELS = ['debug', 'info', 'warn', 'error']

function timestamp() {
  const now = new Date()

  const dirName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const fileName = `${dirName}-${now.getDate().toString().padStart(2, '0')}.log`
  const time = `${[
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0')
  ].join(':')}.${now.getMilliseconds().toString().padStart(3, '0')}`

  return {dirName, fileName, time}
}

function log(level, msg) {
  const {dirName, fileName, time} = timestamp()
  const content = `[${time}] [${level}] ${msg}`

  const dir = path.join(config.logPath, dirName)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true, mode: '777'})
  }

  level = level.toLowerCase()

  if (console[level]) {
    console[level](content)
  } else {
    console.log(content)
  }

  const allowIdx = LEVELS.indexOf(config.logLevel.toLowerCase())
  const idx = LEVELS.indexOf(level)

  if (idx < allowIdx) {
    return
  }

  // 写文件
  fs.appendFileSync(path.join(dir, fileName), content + '\n', {encoding: 'utf-8'})
}

module.exports = {
  info(msg) {
    log('INFO', msg)
  },
  warn(msg) {
    log('WARN', msg)
  },
  error(msg) {
    log('ERROR', msg)
  },
  debug(msg) {
    log('DEBUG', msg)
  }
}
