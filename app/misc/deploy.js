const fs = require('fs')
const path = require('path')

const logger = require('./logger')
const util = require('./util')
const config = require('../config')

const FLAG_DIR = path.join(config.projectRoot, '.pending')

async function setFlag(name) {
  await util.writeFile(path.join(FLAG_DIR, name), '')
}

function removeFlag(name) {
  fs.unlinkSync(path.join(FLAG_DIR, name))
}

/**
 * 从 GIT 检出代码
 * @param {{repository: {full_name: string, clone_url: string}}} data
 * @param eventType
 * @return {Promise<string>}
 */
async function checkoutRepo(data, eventType) {
  /**
   * @type {{owner: object, ref_type: string}} repository
   * @type {string} ref 操作名称（branch名称/tag名称）
   * @type {string} ref_type 操作类型（branch/tag）
   */
  const {repository, ref, ref_type: type} = data
  const name = repository.name
  const branch = ref.split('/')[2]

  // 由用户名和项目名称组成
  const dist = path.join(config.projectTemp, repository.owner.username, name)

  const fullName = data.repository.full_name.replace('/', '#')
  const url = data.repository.clone_url

  // 写检出标记
  await setFlag(fullName)

  logger.info(`Checkout: ${url}`)

  let dirExists = fs.existsSync(dist)

  // .git 目录是否存在
  if (!fs.existsSync(path.join(dist, '.git'))) {
    fs.rmdirSync(dist, {recursive: true})
    dirExists = false
  }

  if (dirExists) {
    // 清空工作目录
    await util.runCommand(`git clean -f -d "${dist}"`, dist)
    // logger.info(`rmdir: ${dist}`)
    // fs.rmdirSync(dist, {recursive: true})
    // git --work-tree=${WEB_DIR} checkout --force
    await util.runCommand(`git fetch origin ${branch} --verbose`, dist)
    await util.runCommand(`git reset --hard origin/${branch}`, dist)
    await util.runCommand(`git pull --verbose`, dist)
    // await util.runCommand(`git checkout -b ${branch} origin/${branch} -f`, dist)
  } else {
    logger.info(`mkdir: ${dist}`)
    fs.mkdirSync(dist, {recursive: true, mode: '777'})

    // 克隆代码
    await util.runCommand(`git clone -b ${branch} --verbose --depth=1 ${url} "${dist}"`, dist)
  }

  // 写 push 数据
  await util.writeFile(path.join(dist, '.pages.push'), data)

  const configFile = path.join(dist, config.configFile)

  if (fs.existsSync(configFile)) {
    const pageConfig = JSON.parse(await util.readFileContent(configFile))
    if (pageConfig.tag) {
      if (type !== 'tag' || eventType !== 'create') {
        return 'Ignore: not a tag'
      }
    }
    if (pageConfig.branch) {
      if (ref !== `refs/head/${pageConfig.branch}`) {
        return 'Ignore: branches are not expected'
      }
    }
  }

  // 移动目录
  const workingDir = path.join(config.projectRoot, repository.owner.username, name)
  if (fs.existsSync(workingDir)) {
    fs.rmdirSync(workingDir, {recursive: true})
  }

  // // 此操作无法跨分区工作
  // fs.renameSync(dist, workingDir)
  // Windows
  const ignoreFile = path.join(config.projectTemp, '.ignore', `${repository.owner.username}#${name}.txt`)
  if (!fs.existsSync(path.dirname(ignoreFile))) {
    fs.mkdirSync(path.dirname(ignoreFile), {recursive: true})
  }
  if (!fs.existsSync(ignoreFile)) {
    fs.writeFileSync(ignoreFile, path.join(dist, '.git'), {encoding: 'utf-8'})
  }
  await util.runCommand(`xcopy "${dist}" "${workingDir}" /S /I /EXCLUDE:${ignoreFile}`)

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
