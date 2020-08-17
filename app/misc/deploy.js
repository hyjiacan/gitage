const fs = require('fs')
const path = require('path')

const logger = require('./logger')
const util = require('./util')
const cache = require('./cache')
const config = require('../config')
const os = require('os')

const VERBOSE = '' // --verbose

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
 * @return {Promise<string>}
 */
async function checkoutRepo(data) {
  /**
   * @type {{owner: object, ref_type: string}} repository
   * @type {string} ref 操作名称（branch名称/tag名称）
   */
  const {repository, ref} = data
  const name = repository.name
  const branch = ref.split('/')[2]

  // 由用户名和项目名称组成
  const tempDir = path.join(config.projectTemp, repository.owner.username, name)

  const fullName = repository.full_name.replace('/', '#')
  const url = repository.clone_url

  // 写检出标记
  await setFlag(fullName)
  try {

    logger.info(`Checkout: ${url}`)

    let dirExists = fs.existsSync(tempDir)

    // .git 目录是否存在
    if (!fs.existsSync(path.join(tempDir, '.git'))) {
      fs.rmdirSync(tempDir, {recursive: true})
      dirExists = false
    }

    if (dirExists) {
      // 清空工作目录
      await util.runCommand(`git clean -f -d "${tempDir}"`, tempDir)
      // logger.info(`rmdir: ${dist}`)
      // fs.rmdirSync(dist, {recursive: true})
      // git --work-tree=${WEB_DIR} checkout --force
      await util.runCommand(`git fetch origin ${branch} --prune ${VERBOSE}`, tempDir)
      // await util.runCommand(`git reset --hard origin/${branch}`, dist)
      const head = await util.readFileContent(path.join(tempDir, '.git', 'HEAD'))
      logger.info('Checking current branch name: ' + head)
      if (!head.startsWith(`ref: refs/heads/${branch}`)) {
        await util.runCommand(`git checkout -B ${branch} -f`, tempDir)
      }
      await util.runCommand(`git pull origin ${branch} ${VERBOSE}`, tempDir)
    } else {
      logger.info(`mkdir: ${tempDir}`)
      fs.mkdirSync(tempDir, {recursive: true, mode: '777'})

      // 克隆代码
      await util.runCommand(`git clone -b ${branch} ${VERBOSE} --depth=1 ${url} "${tempDir}"`, tempDir)
    }

    // 写 push 数据
    await util.writeFile(path.join(tempDir, config.pushFile), data)

    const configFile = path.join(tempDir, config.configFile)

    let pageConfig
    if (fs.existsSync(configFile)) {
      pageConfig = await util.readFileContent(configFile, true)
      //   if (pageConfig.tag) {
      //     if (type !== 'tag' || eventType !== 'create') {
      //       return 'Ignore: not a tag'
      //     }
      //   }
      //   if (pageConfig.branch) {
      //     if (branch !== pageConfig.branch) {
      //       return `Ignore: branch ${branch} is not expected`
      //     }
      //   }
    }

    // 移动目录
    const workingDir = path.join(config.projectRoot, repository.owner.username, name)
    if (fs.existsSync(workingDir)) {
      fs.rmdirSync(workingDir, {recursive: true})
    }
    fs.mkdirSync(workingDir)

    const ignore = pageConfig && pageConfig.ignore ? pageConfig.ignore : []
    ignore.push('.git')

    const ignoreFile = path.join(config.projectTemp, '.ignore', `${repository.owner.username}#${name}.txt`)
    if (!fs.existsSync(path.dirname(ignoreFile))) {
      fs.mkdirSync(path.dirname(ignoreFile), {recursive: true})
    }

    // // 此操作无法跨分区工作
    // fs.renameSync(dist, workingDir)
    if (process.platform === 'win32') {
      // Windows
      // 忽略使用绝对路径
      // 忽略的文件/目录
      // gitage.config.js ->
      // ignore: []
      fs.appendFileSync(ignoreFile, ignore.map(item => path.join(tempDir, item)).join(os.EOL), {encoding: 'utf8'})

      await util.runCommand(`xcopy "${tempDir}" "${workingDir}" /S /I${VERBOSE ? '' : ' /Q'} /EXCLUDE:${ignoreFile}`, tempDir)
    } else {
      // Linux
      // 忽略使用相对路径
      // 忽略的文件/目录
      // gitage.config.js ->
      // ignore: []
      fs.appendFileSync(ignoreFile, ignore.join(os.EOL), {encoding: 'utf8'})
      const command = [
        'rsync',
        '-ar',
        '--exclude-from',
        ignoreFile,
        tempDir,
        workingDir
      ]
      await util.runCommand(command.join(' '), tempDir)
    }
    // 移除目录缓存
    cache.remove('catalog', fullName)
    cache.remove('projects', 'projects')
    logger.info('Checkout done!')
  } catch (e) {
    logger.error(e)
  } finally {
    // 移除检出标记
    removeFlag(fullName)
  }
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
