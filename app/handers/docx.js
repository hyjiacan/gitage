const mammoth = require('mammoth')
const handlers = require('../http/handlers')

handlers.register(/\.docx$/i, async (filename) => {
  const {value} = await mammoth.convertToHtml({path: filename})
  return value
})
