const path = require('path')

const routes = Object.create(null)

/**
 * 从注册的 requestPath 中解析出请求参数
 * 格式: /path/to/<param1>/<param2>/
 * resolvePath('/path/to/:a/:b/')
 * @param requestPath
 * @return {{path: string, match: Function, isDynamic: boolean}}
 */
function resolvePath(requestPath) {
  // 没有动态参数
  if (requestPath.indexOf(':') === -1) {
    return {
      path: requestPath,
      isDynamic: false,
      match: val => {
        return val.startsWith(requestPath)
      }
    }
  }

  const endFlag = requestPath.endsWith('$') ? '$' : ''

  const matchPath = requestPath.replace(/\./g, '\\$1').split('/').map(item => {
    if (!item) {
      return item
    }
    const temp = /:([^/]+)/.exec(item)
    if (!temp) {
      return item
    }
    return `(?<${temp[1]}>[^/]+)`
  }).join('/') + endFlag

  return {
    path: requestPath,
    isDynamic: true,
    match: val => {
      return new RegExp(matchPath).exec(val)
    }
  }
}

/**
 *
 * @param {HttpRequest} request
 * @param {HttpResponse} response
 */
async function route(request, response) {
  const method = request.method

  const requestPath = request.path

  if (!requestPath.endsWith('/') && !path.extname(requestPath)) {
    // 重定向
    response.redirect(requestPath + '/')
    return
  }

  let handlers = []

  // 使用最长匹配
  const keys = Object.keys(routes)
  // 倒序排列
  keys.sort((a, b) => a.length > b.length ? -1 : 1)
  for (const key of keys) {
    const route = routes[`${method}#${key}`] || routes[key]
    const match = route.match(requestPath)
    if (!match) {
      continue
    }
    handlers.push({
      handler: route.handler,
      params: match.groups
    })
  }

  if (!handlers.length) {
    response.notFound()
    return
  }

  await invokeRouterHandler(request, response, handlers, 0)
}

async function invokeRouterHandler(request, response, handlers, index) {
  if (index >= handlers.length) {
    response.notFound()
    return
  }
  const {handler, params} = handlers[index]

  request.params = params

  await handler(request, response, () => {
    invokeRouterHandler(request, response, handlers, index + 1)
  })
}

function request(path, handler) {
  routes[path] = {
    ...resolvePath(path),
    handler
  }
}

function get(path, handler) {
  routes[`GET#${path}`] = {
    ...resolvePath(path),
    handler
  }
}

function post(path, handler) {
  routes[`POST#${path}`] = {
    ...resolvePath(path),
    handler
  }
}

function put(path, handler) {
  routes[`PUT#${path}`] = {
    ...resolvePath(path),
    handler
  }
}

module.exports = {
  route,
  request,
  get,
  post,
  put
}
