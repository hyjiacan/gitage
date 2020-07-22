const fs = require('fs')
const path = require('path')

const config = require('../config')

const MIME = require('../assets/mime')
const util = require('../misc/util')
const logger = require('../misc/logger')
const deploy = require('../misc/deploy')
const cache = require('../misc/cache')

const PAGE_CONFIG_MAP = {}

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
  const dirName = pageConfig.path || 'docs'
  const pageRoot = PAGE_CONFIG_MAP[projectName] = path.join(projectPath, dirName)
  // 部署内容的类型
  const contentType = pageConfig.type
  const indexFile = path.join(pageRoot, pageConfig.index || (contentType === 'markdown' ? 'index.md' : 'index.html'))

  conf = {
    index: indexFile,
    root: pageRoot,
    type: contentType,
    dirName
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

/**
 * 根据 markdown 文件结构生成目录
 * @return {Promise<>}
 */
async function getMarkdownCatalog(currentPath, root) {
  root = root || currentPath
  const relativeRoot = path.relative(root, currentPath)
  const entities = await util.readEntities(currentPath)

  // entities.sort((a, b) => a > b ? 1 : -1)

  const dirs = []
  const files = []

  for (const entity of entities) {
    const abs = path.join(currentPath, entity)
    const stat = fs.statSync(abs)
    // 读取目录
    if (stat.isDirectory()) {
      const children = await getMarkdownCatalog(abs, root)
      if (!children.length) {
        continue
      }
      dirs.push({
        type: 'dir',
        name: path.basename(entity),
        children
      })
    }
    // 文件
    const ext = path.extname(entity)
    if (!/^\.(md|markdown|txt|text)$/i.test(ext)) {
      continue
    }
    files.push({
      name: path.basename(entity, ext),
      ext,
      file: encodeURI(path.join(relativeRoot, entity).replace(/\\/g, '/'))
    })
  }
  return dirs.concat(files)
}

async function renderMarkdown(res, option) {
  let {userName, projectName, requestName, docRoot, catalog, isReadme} = option

  const content = await util.readFileContent(path.join(config.projectRoot, userName, projectName, config.pushFile))
  // 这是原始的 push 数据
  const project = JSON.parse(content)
  requestName = requestName.replace(/\\/g, '/')

  await res.render('markdown.html', {
    $project: project,
    userName,
    projectName,
    catalog: catalog || [],
    file: encodeURI(requestName.replace(/^\//, '')),
    name: path.basename(requestName),
    isReadme,
    editUrl: [
      project.repository.html_url.replace(/\/$/g, ''),
      project.ref.replace('refs/heads', 'src/branch'),
      isReadme ? '' : docRoot.replace(/^\/(.+?)?\/?$/g, '$1'),
      requestName.replace(/^\//, '')
    ].filter(i => !!i).join('/')
  })
}

module.exports = {
  async read(userPath) {
    const dirs = await util.readDir(userPath)
    const projects = []
    for (const dir of dirs) {
      const content = await util.readFileContent(path.join(userPath, dir, config.pushFile))
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
  async index(req, res, requestPath) {
    const userName = req.params.user
    const projectName = req.params.project

    const projectPath = path.join(config.projectRoot, userName, projectName)

    if (!util.checkPath(res, projectPath)) {
      return
    }

    const fullName = `${userName}/${projectName}`

    if (deploy.isPending(fullName)) {
      await res.notAvailable(`Project ${fullName} is deploying, please waiting for a moment`)
      return
    }

    const conf = await getPageConfig(userName, projectName)

    // 查看项目的 readme
    if (/^\/readme/i.test(requestPath)) {
      if (!util.checkPath(res, path.join(projectPath, requestPath))) {
        return
      }
      await renderMarkdown(res, {
        userName,
        projectName,
        requestName: requestPath,
        docRoot: conf.dirName,
        isReadme: true
      })
      return
    }

    const filename = requestPath === '/' ? conf.index : path.join(conf.root, requestPath)

    const abs = path.resolve(filename)

    // 如果最后的绝对路径不是以 projectPath 开头，表示越权访问了
    if (!abs.startsWith(projectPath)) {
      logger.warn(`Access not granted: ${requestPath}`)
      res.notFound()
      return
    }

    const ext = path.extname(filename)

    // 部署的是 markdown 内容
    if (conf.type === 'markdown' && /^\.(markdown|md|txt|text)$/i.test(ext)) {
      const catalog = await cache.get('catalog', fullName, () => {
        return getMarkdownCatalog(conf.root)
      })
      await renderMarkdown(res, {
        userName,
        projectName,
        requestName: path.relative(conf.root, filename),
        docRoot: conf.dirName,
        catalog
      })
      return
    }

    // 文件是否存在
    if (!fs.existsSync(abs)) {
      logger.warn(`Assets not found: ${abs}`)
      res.notFound()
      return
    }

    const content = await util.readFile(filename)
    const mime = MIME[ext] || 'application/octet-stream'
    res.write(content, mime)
  },
  async raw(req, res, requestPath) {
    const userName = req.params.user
    const projectName = req.params.project

    const projectPath = path.join(config.projectRoot, userName, projectName)

    if (!util.checkPath(res, projectPath)) {
      return
    }

    const fullName = `${userName}/${projectName}`

    if (deploy.isPending(fullName)) {
      await res.notAvailable(`Project ${fullName} is deploying, please waiting for a moment`, 'text/plain')
      return
    }
    const conf = await getPageConfig(userName, projectName)

    const filename = /^\/readme/i.test(requestPath) ? path.join(projectPath, requestPath) : path.join(conf.root, requestPath)

    const abs = path.resolve(filename)

    // 如果最后的绝对路径不是以 projectPath 开头，表示越权访问了
    if (!abs.startsWith(projectPath)) {
      res.notFound()
      return
    }

    // 文件是否存在
    if (!fs.existsSync(abs)) {
      res.notFound()
      return
    }

    const content = await util.readFile(abs)
    const ext = path.extname(abs)
    const mime = MIME[ext] || 'application/octet-stream'
    res.write(content, mime)
  }
}
