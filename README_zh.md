# git-pages

基于 web-hook 的 GIT 静态服务器。运行在 NodeJS 上。

目前仅测试过 [gitea](https://gitea.io/)

依赖:

- 简单的 js 模板引擎 [wet](http://gitee.com/hyjiacan/wet)

运行时需要服务器上安装了 git, nodejs>8

## 用法

```shell script
npm run build
node dist/pages.js
```

## 服务器配置

配置文件名为 `config` (区分大小写)，放置在部署根目录。

*config*
```
# 系统名称
APP_NAME = Git Pages
# 是否启用调试
DEBUG = true
# 启动服务的IP地址
HOST = 0.0.0.0
# 启动服务的端口
PORT = 1997
# 日志路径，可以指定为绝对路径或相对路径
LOG_PATH = logs
# 日志记录的级别
LOG_LEVEL = info
# 仓库部署路径，可以指定为绝对路径或相对路径
PROJECT_ROOT_PATH = projects
# 仓库检出临时目录，留空使用系统临时目录
PROJECT_CHECKOUT_TMP = 
```

> 在无此文件时，使用以上默认配置

> 注意：配置项名称均使用大写

## 仓库配置

在仓库下添加文件 `pages.config.json`，其格式如下(可选):

```json
{
  "type": "markdown",
  "path": "docs",
  "index": "index.html",
  "tag": true,
  "branch": "master"
}
```

- `type` 标记部署内容的类型，目前仅支持 `markdown`，表示内容为 `markdown`，否则直接留空 **区分大小写**
- `path` 部署目录，默认为 `docs`
- `index` 部署目录下的索引页名称，默认为 `index.html/index.md` **区分大小写**
- `tag` 是否仅在收到 `tag` 时部署，默认为 `false` (计划中)

在仓库的 web hook 上添加地址:

POST `http://127.0.0.1:1997/hook/`


`127.0.0.1` 是部署的服务器IP
`1997` 是部署的端口

## 开发计划

### 0.5.3

- [ ] 添加新的首页，将所有项目列表页独立成一个页面
  - [ ] 最近更新的项目 (数据待统计，目前可以考虑通过部署时生成数据到指定目录下)
- [x] 将用户的项目列表页面与所有项目列表页分开
- [ ] 添加页面样式，(需要一个支持静态树结构样式的库)
- [ ] 项目列表添加分页支持
### 0.6.0
- [ ] 插件支持
- [ ] 优化 `wet` 性能
