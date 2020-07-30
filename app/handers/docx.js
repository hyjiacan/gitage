const fs = require('fs')
const mammoth = require('mammoth')
const handlers = require('../http/handlers')

handlers.register(/\.docx$/i, async (filename, {output}) => {
  const {value} = await mammoth.convertToHtml({path: filename})
  fs.writeFileSync(output, value)
  return {ext: '.html', mime: 'text/html'}
})
