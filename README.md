# git-pages

A static server for Git based on web-hook. Running on NodeJS.

Tested on [gitea](https://gitea.io/) for now.

Dependencies:

- Simple Javascript Template Engine [wet](http://github.com/hyjiacan/wet)

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


`127.0.0.1` The IP to serve
`1997` The port to serve
