# git-pages

基于 Node.js 的 GIT 静态服务器。

目前仅支持 [gitea](https://gitea.io/)

## 配置

在项目下添加文件 `pages.config.json`，其格式如下:

```json
{
  "path": "docs",
  "index": "index.html",
  "tag": true
}
```

- `path` 部署目录，默认为 `docs`
- `index` 部署目录下的索引页名称，默认为 `index.html`
- `tag` 是否仅在收到 `tag` 时部署，默认为 `false`

## 待办

- [ ] 移除非发布目录
- [x] 运行日志
- [ ] 检查请求是否跨项目了（不允许通过 `..` 访问其它目录）
- [ ] 渲染 README 文件
