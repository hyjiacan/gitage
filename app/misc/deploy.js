const fs = require('fs')
const path = require('path')

const logger = require('./logger')
const util = require('./util')
const config = require('../config')

const FLAG_DIR = path.join(config.projectRoot, '.pending')

function setFlag(name) {
  util.writeFile(path.join(FLAG_DIR, name), '')
}

function removeFlag(name) {
  fs.unlinkSync(path.join(FLAG_DIR, name))
}

/**
 * 从 GIT 检出代码
 * @param data
 * @param dist
 * @return {Promise<void>}
 */
async function checkoutRepo(data, dist) {
  const fullName = data.repository.full_name.replace('/', '#')
  const url = data.repository.cloneUrl

  // 写检出标记
  setFlag(fullName)

  logger.info(`Checkout: ${url}`)

  if (fs.existsSync(dist)) {
    // 清空工作目录
    await util.runCommand(`git clean -f -d "${dist}"`, dist)
    // logger.info(`rmdir: ${dist}`)
    // fs.rmdirSync(dist, {recursive: true})
    // git --work-tree=${WEB_DIR} checkout --force
    await util.runCommand(`git pull --verbose`, dist)
    await util.runCommand(`git checkout -f`, dist)
  }else{
    logger.info(`mkdir: ${dist}`)
    fs.mkdirSync(dist, {recursive: true, mode: '777'})

    // 克隆代码
    await util.runCommand(`git clone --verbose --depth=1 ${url} "${dist}"`, dist)
  }

  // 写 push 数据
  util.writeFile(path.join(dist, '.pages.push'), data)

  // 移除检出标记
  removeFlag(fullName)
}

module.exports = {
  checkout: checkoutRepo,
  /**
   * 清空检出标记
   */
  clearFlag() {
    if (fs.existsSync(FLAG_DIR)) {
      fs.rmdirSync(FLAG_DIR, {recursive: true})
    }
  },
  /**
   * 项目是否正在部署
   * @param fullName
   * @return {boolean}
   */
  isPending(fullName) {
    return fs.existsSync(path.join(FLAG_DIR, fullName.replace('/', '#')))
  }
}
