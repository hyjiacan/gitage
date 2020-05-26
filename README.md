# git-pages

基于 Node.js 的 GIT 静态服务器。

目前仅支持 [gitea](https://gitea.io/)

依赖:

- 简单的 js 模板引擎 [jst](http://gitee.com/hyjiacan/jst.git)

## 配置

在项目下添加文件 `pages.config.json`，其格式如下(可选):

```json
{
  "path": "docs",
  "index": "index.html",
  "tag": true
}
```

- `path` 部署目录，默认为 `docs`
- `index` 部署目录下的索引页名称，默认为 `index.html`
- `tag` 是否仅在收到 `tag` 时部署，默认为 `false` (计划中)

在仓库的 web hook 上添加地址:

`http://127.0.0.1:1997/api/hooks`

`127.0.0.1` 是部署的服务器IP
`1997` 是部署的端口

## 待办

- [ ] 移除非发布目录
- [x] 运行日志
- [ ] 检查请求是否跨项目了（不允许通过 `..` 访问其它目录）
- [ ] 渲染 README 文件
