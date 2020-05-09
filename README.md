# git-pages

基于 Node.js 的 GIT 静态服务器。

目前仅支持 [gitea](https://gitea.io/)

## 配置

在项目下添加文件 `pages.config.json`，其格式如下:

```json
{
  "path": "docs",
  "index": "index.html"
}
```

## 待办

- [ ] 允许接收不同类型的 hook: `push/tag`
- [ ] 移除非发布目录
- [ ] 运行日志
- [ ] Index 页面展示更多信息
  - [ ] 作者
  - [ ] 最新版本
  - [ ] 最后更新日期
