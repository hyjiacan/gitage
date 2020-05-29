const fs = require('fs')
const path = require('path')

const md0 = require('../../externals/md0/md0')

const config = require('../config')

const MIME = require('../assets/mime')
const util = require('../misc/util')
const deploy = require('../misc/deploy')

const PAGE_CONFIG_MAP = {}

let md0css

/**
 * 从缓存中读取缓存数据，如果没有缓存那么就先写入
 * @return {Promise<string>}
 */
async function getReadme(projectPath, readmeFile) {
  // 缓存文件
  const cacheFile = path.join(projectPath, '.readme.cache')
  let content
  if (fs.existsSync(cacheFile)) {
    content = await util.readFileContent(cacheFile)
  } else {
    const md = await util.readFileContent(readmeFile)
    // 使用 md0 渲染
    // TODO 暂时假设都是 markdown 文件
    content = md0(md, {
      useHljs: true
    })
  }
  return content
}

// 读取配置文件
async function getPageConfig(userName, projectName) {
  const id = `${userName}/${projectName}`

  let conf = PAGE_CONFIG_MAP[id]
  if (conf) {
    return conf
  }

  const projectPath = path.join(config.projectRoot, userName, projectName)
  const configFile = path.join(projectPath, config.configFile)
  const pageConfig = fs.existsSync(configFile) ? JSON.parse(await util.readFileContent(configFile)) : {}
  const pageRoot = PAGE_CONFIG_MAP[projectName] = path.join(projectPath, pageConfig.path || 'docs')
  const indexFile = path.join(pageRoot, pageConfig.index || 'index.html')

  conf = {
    index: indexFile,
    root: pageRoot
  }

  PAGE_CONFIG_MAP[id] = conf

  return conf
}

/**
 * 读取项目下的 readme 文件，并返回其文件名
 * @param projectPath
 * @return {Promise<string|null>}
 */
async function getReadmeFile(projectPath) {
  const files = await util.readDir(projectPath, true)
  // 查找第一个 以 readme 开头的文件即可
  // 忽略大小写
  for (const file of files) {
    if (/^readme/i.test(file)) {
      return path.join(file)
    }
  }
  return null
}

module.exports = {
  async read(userPath) {
    const dirs = await util.readDir(userPath)
    const projects = []
    for (const dir of dirs) {
      const content = await util.readFileContent(path.join(userPath, dir, '.pages.push'))
      // 这是原始的 push 数据
      const project = JSON.parse(content)
      // 追加 readme 文件信息
      const readmeFile = await getReadmeFile(path.join(userPath, dir))
      if (readmeFile) {
        project.readme = readmeFile
      }
      projects.push(project)
    }
    return projects
  },
  async index(res, userName, projectName) {
    const projectPath = path.join(config.projectRoot, userName, projectName)

    if (!util.checkPath(res, projectPath)) {
      return
    }

    const fullName = `${userName}/${projectName}`

    if (deploy.isPending(fullName)) {
      res.writeHead(200, {'content-type': 'text/plain'})
      res.write(`Project ${fullName} is deploying, please waiting for a moment`)
      res.end()
      return
    }

    const conf = await getPageConfig(userName, projectName)
    const content = await util.readFile(conf.index)

    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': content.length
    })
    res.write(content)
    res.end()
  },

  async readme(res, userName, projectName, filePath) {
    const projectPath = path.join(config.projectRoot, userName, projectName)
    const readmeFile = path.join(projectPath, filePath)
    if (!util.checkPath(res, readmeFile)) {
      return
    }
    const html = await getReadme(projectPath, readmeFile)
    if (!md0css) {
      md0css = await util.readFileContent(path.join(config.root, 'externals', 'md0', 'md0.css'))
    }
    res.render('markdown.html', {
      title: `${userName}/${projectName}`,
      css: md0css,
      content: html
    })
  },

  async getStatic(res, userName, projectName, filePath) {
    const conf = await getPageConfig(userName, projectName)
    filePath = path.join(conf.root, filePath)
    if (!util.checkPath(res, filePath)) {
      return
    }
    const ext = path.extname(filePath)
    const mime = MIME[ext] || 'application/octet-stream'
    const content = await util.readFile(filePath)
    res.writeHead(200, {
      'Content-Type': mime,
      'content-length': content.length
    })
    res.write(content)
    res.end()
  }
}
