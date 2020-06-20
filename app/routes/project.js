const fs = require('fs')
const path = require('path')

const config = require('../config')

const MIME = require('../assets/mime')
const util = require('../misc/util')
const deploy = require('../misc/deploy')

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
  const pageRoot = PAGE_CONFIG_MAP[projectName] = path.join(projectPath, pageConfig.path || 'docs')
  // 部署内容的类型
  const contentType = pageConfig.type
  const indexFile = path.join(pageRoot, pageConfig.index || (contentType === 'markdown' ? 'index.md' : 'index.html'))

  conf = {
    index: indexFile,
    root: pageRoot,
    type: contentType
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

  const result = []

  for (const entity of entities) {
    const abs = path.join(currentPath, entity)
    const stat = fs.statSync(abs)
    // 读取目录
    if (stat.isDirectory()) {
      const children = await getMarkdownCatalog(abs, root)
      if (!children.length) {
        continue
      }
      result.push({
        type: 'dir',
        name: path.basename(entity),
        children
      })
    }
    // 文件
    const ext = path.extname(entity)
    if (!/^\.(md|markdown)$/i.test(ext)) {
      continue
    }
    result.push({
      name: path.basename(entity, ext),
      file: path.join(relativeRoot, encodeURIComponent(entity)).replace(/\\/g, '/')
    })
  }
  return result
}

async function renderMarkdown(res, userName, projectName, requestName, catalog) {
  await res.render('markdown.html', {
    userName,
    projectName,
    catalog: catalog || [],
    file: encodeURIComponent(requestName.replace(/^\//, '')),
    name: path.basename(requestName)
  })
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
  async index(req, res, requestPath) {
    const userName = req.params.user
    const projectName = req.params.project

    const projectPath = path.join(config.projectRoot, userName, projectName)

    if (!util.checkPath(res, projectPath)) {
      return
    }

    const fullName = `${userName}/${projectName}`

    if (deploy.isPending(fullName)) {
      res.write(`Project ${fullName} is deploying, please waiting for a moment`)
      return
    }

    // 查看项目的 readme
    if (/^\/readme/i.test(requestPath)) {
      if (!util.checkPath(res, path.join(projectPath, requestPath))) {
        return
      }
      await renderMarkdown(res, userName, projectName, requestPath)
      return
    }

    const conf = await getPageConfig(userName, projectName)

    const filename = requestPath === '/' ? conf.index : path.join(conf.root, requestPath)

    const abs = path.resolve(filename)

    // 如果最后的绝对路径不是以 projectPath 开头，表示越权访问了
    if (!abs.startsWith(projectPath)) {
      res.notFound()
      return
    }

    // 部署的是 markdown 内容
    if (conf.type === 'markdown') {
      const catalog = await getMarkdownCatalog(conf.root)
      await renderMarkdown(res, userName, projectName, path.relative(conf.root, filename), catalog)
      return
    }

    const content = await util.readFile(filename)
    const ext = path.extname(filename)
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
      res.write(`Project ${fullName} is deploying, please waiting for a moment`, 'text/plain')
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
    const content = await util.readFile(filename)
    const ext = path.extname(filename)
    const mime = MIME[ext] || 'application/octet-stream'
    res.write(content, mime)
  }
}
