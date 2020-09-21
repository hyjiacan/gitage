const fs = require('fs')
const mammoth = require('mammoth')

const handlers = [{
  test: /\.docx$/i,
  async handler(filename, {output}) {
    const {value} = await mammoth.convertToHtml({path: filename})
    fs.writeFileSync(output, value)
    return {ext: '.html', mime: 'text/html'}
  }
}, {
  test: /\.pdf$/i,
  handler(filename, {output}) {
    const content = fs.readFileSync(filename)
    fs.writeFileSync(output, content)
    return {ext: '.pdf', mime: 'application/pdf'}
  }
}]

module.exports = handlers
