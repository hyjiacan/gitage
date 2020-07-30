const fs = require('fs')
const path = require('path')

const config = require('../config')
const util = require('../misc/util')

const handlers = []

const cachePath = path.join(config.cachePath, 'handlers')

function register(test, handler) {
  handlers.push({
    expression: test,
    handler
  })
}

function match(ext, mime) {
  let handler
  for (const item of handlers) {
    if (!item.expression.test(ext) && !item.expression.test(mime)) {
      continue
    }
    handler = item.handler
    break
  }
  return handler
}

async function handle(filename, ext, mime) {
  const handler = match(ext, mime)
  if (!handler) {
    return null
  }
  const relPath = path.relative(config.projectRoot, filename)
  const {userName, projectName} = /^[\\/]?(?<userName>.+?)[\\/](?<projectName>.+?)[\\/]/.exec(relPath).groups
  const md5 = await util.getFileMd5(filename)

  const cacheFileName = path.join(cachePath, userName, projectName, `${md5}.html`)

  // Try to read from cache
  if (fs.existsSync(cacheFileName)) {
    return cacheFileName
  }
  const result = await handler.call(null, filename, {ext, mime})
  await util.writeFile(cacheFileName, result)
  return cacheFileName
}

module.exports = {
  register,
  match,
  handle
}
