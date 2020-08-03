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

  const cacheFileName = path.join(cachePath, relPath)
  const cacheFilePath = path.dirname(cacheFileName)
  if (!fs.existsSync(cacheFilePath)) {
    fs.mkdirSync(cacheFilePath, {recursive: true})
  }

  // Try to read from cache
  if (fs.existsSync(cacheFileName)) {
    const {ext, mime} = await util.readFileContent(cacheFileName + '.json', true)
    return {
      ext,
      mime,
      file: cacheFileName
    }
  }
  const result = await handler.call(null, filename, {ext, mime, output: cacheFileName})
  if (!result.ext) {
    throw new Error('Return value of handler must contains field "ext"')
  }
  if (!result.mime) {
    throw new Error('Return value of handler must contains field "mime"')
  }
  await util.writeFile(cacheFileName + '.json', result)
  return {
    ext: result.ext,
    mime: result.mime,
    file: cacheFileName
  }
}

module.exports = {
  register,
  match,
  handle
}
