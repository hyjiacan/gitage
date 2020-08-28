const fs = require('fs')
const path = require('path')
const {parentPort} = require('worker_threads')

const config = require('../app/config')

const util = require('../app/misc/util')
const deploy = require('../app/misc/deploy')
const MIME = require('../app/assets/mime.json')
const handlers = require('../app/http/handlers')


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
    const mime = MIME[ext] || 'application/octet-stream'
    if (!/^\.(md|markdown|txt|text)$/i.test(ext) && !handlers.match(ext, mime)) {
      continue
    }
    const meta = await getMeta(abs)
    files.push({
      name: path.basename(entity),
      ext,
      file: encodeURI(path.join(relativeRoot, entity).replace(/\\/g, '/')),
      meta
    })
  }
  return dirs.concat(files)
}

function getMeta(filename) {
  const relPath = path.relative(config.projectRoot, filename)
  const {project, file} = /^(?<project>.+?[/\\].+?)[/\\](?<file>.+)$/.exec(relPath).groups
  return deploy.getFileInfo(project, file)
}

parentPort.on('message', async (e) => {
  const catalog = await getMarkdownCatalog(e.path, e.path)
  parentPort.postMessage(catalog)
})
