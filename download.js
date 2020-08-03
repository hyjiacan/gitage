const fs = require('fs')
const path = require('path')
const https = require('https')
const chalk = require('chalk')

const pkg = require('./package.json')

function download(link, paths, options) {
  const temp = link.split('->')
  link = temp[0]

  const filename = temp[1] || path.basename(link)
  const targetPath = paths.filter(i => !!i).join(path.sep)
  const targetFile = path.join(targetPath, filename)

  console.log(`Downloading ${link} into ${targetFile}`)

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, {recursive: true})
  }

  const url = new URL(link)
  if (!options) {
    options = {}
  }
  if (!options.headers) {
    options.headers = {}
  }
  options = {
    host: url.host,
    path: url.pathname,
    headers: {
      'user-agent': `${pkg.name}/${pkg.version}`,
      'accept-encoding': 'utf-8',
      ...options.headers
    },
    rejectUnauthorized: false
  }

  https.get(options, res => {
    if (res.statusCode !== 200) {
      throw new Error(res.statusMessage)
    }
    let content
    res.on('data', data => {
      if (content) {
        content = Buffer.concat([content, data])
      } else {
        content = data
      }
    })

    res.on('end', () => {
      fs.writeFileSync(targetFile, content)
      console.log(`${filename} download complete`)
    })

    res.on('error', err => {
      throw err
    })
  })
}

function getAssets(assets, paths) {
  if (typeof assets === 'string') {
    download(assets, paths)
    return
  }

  if (Array.isArray(assets)) {
    assets.map(url => download(url, paths))
    return
  }

  if (typeof assets !== 'object') {
    return
  }

  if (assets.url) {
    download(assets.url, paths, assets)
    return
  }

  Object.keys(assets).map(name => {
    getAssets(assets[name], [...paths, name])
  })
}

function start() {
  const assetsRoot = path.resolve(path.join(__dirname, 'web', 'static', 'lib'))

  const packName = process.argv[2]
  if (packName) {
    if (!pkg.assets.hasOwnProperty(packName)) {
      console.error(`\nPackage ${chalk.red(packName)} not found in package.assets\n`)
      process.exit(1)
    }

    console.log(`Start to get ${packName}`)
    getAssets(pkg.assets[packName], [assetsRoot, packName])
    return
  }

  for (const name in pkg.assets) {
    if (!pkg.assets.hasOwnProperty(name)) {
      continue
    }
    console.log(`Start to get ${name}`)
    getAssets(pkg.assets[name], [assetsRoot, name])
  }
}

start()
