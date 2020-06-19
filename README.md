# git-pages

A static server for Git based on web-hook. Running on NodeJS.

Tested on [gitea](https://gitea.io/) for now.

Dependencies:

- Simple Javascript Template Engine [jst](http://github.com/hyjiacan/jst)

Git, nodejs>8 must be installed on your server.

## Usage

```shell script
npm run build
node dist/pages.js
```

## Server Configuration

Config file: `config` (case-sensitive), should be put in the root path of git-pages.

*config*
```
# System name
APP_NAME = Git Pages
# DEBUG flag
DEBUG = true
# serve ip
HOST = 0.0.0.0
# serve port
PORT = 1997
# Path for logs, can be absolute or relative 
LOG_PATH = logs
# Path to checkout repository, can be absolute or relative
PROJECT_ROOT_PATH = projects
```

> If no config file, the value above will be the default values.

> Note: config names must be **UPPERCASE**

## Repo Configuration

Add file `pages.config.json` into your repo, in the form bellow:

```json
{
  "type": "markdown",
  "path": "docs",
  "index": "index.html",
  "tag": true
}
```

- `type` Deploy type, only `markdown` supported currently, or just leave it empty **case-sensitive**
- `path` The directory to deploy (where the static assets located in), default: `docs`
- `index` The index file to deploy，default: `index.html/index.md` **case-sensitive**
- `tag` Whether to deploy only on `tag` pushed，default: `false` (planning)

Add web-hook on your repository:

POST `http://127.0.0.1:1997/hook/`


`127.0.0.1` The deployment IP
`1997` The deployment port

## 开发计划

### 0.4.0

- [x] 运行日志

### 0.5.0

- [x] 项目正在部署时，写文件以标记部署状态，同时将部署状态返回给用户（如果此时有用户在访问）
- [x] 项目路径中添加用户名
- [x] 检查请求是否跨项目了（不允许通过 `..` 访问其它目录）
- [x] 文件IO使用异步
- [x] 渲染 README 文件
- [x] 渲染 README 目录(自动生成目录结构以及菜单)

### 0.6.0

- [ ] 允许仅在收到 tag 推送时重新部署
- [ ] 允许指定分支(通过 `ref: refs/head/master` 来判断)
- [ ] 插件支持
- [ ] 优化 jst 性能
