const fs = require('fs')
const handlers = require('../http/handlers')

handlers.register(/\.pdf$/i, async (filename, {output}) => {
  const content = fs.readFileSync(filename)
  fs.writeFileSync(output, content)
  return {ext: '.pdf', mime: 'application/pdf'}
})
