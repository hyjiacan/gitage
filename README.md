# git-pages

基于 Node.js 的 GIT 静态服务器。无第三方依赖，丢到 Node 上就能直接运行。

目前支持 [gitea](https://gitea.io/)，`gogs` 未测试

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

## htmlparser

htmlparser 是一个深度优先（DFS）的html解析组件（当然，用广度优先我也没有思路）。

## 开发计划

### 0.4.0

- [x] 运行日志

### 0.5.0

- [ ] 移除非发布目录
- [ ] 项目正在部署时，写文件以标记部署状态，同时将部署状态返回给用户（如果此时有用户在访问）
- [ ] 项目路径中添加用户名
- [ ] 检查请求是否跨项目了（不允许通过 `..` 访问其它目录）

### 0.6.0

- [ ] 允许指定分支
- [ ] 添加在线配置
- [ ] 渲染 README 文件
- [ ] 允许仅在收到 tag 推送时重新部署
- [ ] 保留历史版本（在启用tag时）

### 0.7.0

- [ ] 优化 jst 性能
