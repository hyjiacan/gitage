/**
 * 判断是不是 markdown 文件
 * # `` ** __ _ * > -
 * @param content
 * @return {boolean}
 */
function isMarkdown(content) {
  return content.split('\n').some(function (line) {
    if (/^#+/.test(line)) {
      return true
    }
    if (/`.+?`/.test(line)) {
      return true
    }
    if (/^```/.test(line)) {
      return true
    }
    if (/([*_]{1,2}).+?\1/.test(line)) {
      return true
    }
    if (/^\s*>/.test(line)) {
      return true
    }
    if (/\[.+?]\(.+?\)/.test(line)) {
      return true
    }
    if (/^\|?-+/.test(line)) {
      return true
    }
    return false
  })
}
