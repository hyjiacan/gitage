/**
 * 判断是不是 markdown 文件
 * # `` ** __ _ * > -
 * @param content
 * @return {boolean}
 */
function isMarkdown(content) {
  return content.split('\n').some(function (line) {
    // heading
    if (/^#+/.test(line)) {
      return true
    }
    // inline code
    if (/`.+?`/.test(line)) {
      return true
    }
    // block code
    if (/^```/.test(line)) {
      return true
    }
    // quoteblock
    if (/^\s*>/.test(line)) {
      return true
    }
    // link/image
    if (/\[.+?]\(.+?\)/.test(line)) {
      return true
    }
    // table
    if (/^\|?-+/.test(line)) {
      return true
    }
    return false
  })
}
