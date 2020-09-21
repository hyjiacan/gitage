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

function loadFile(url, file) {
  var contentElement = $('#content').html('加载中...')
  $.get(url).then(function (content, state, xhr) {
    var contentType = xhr.getResponseHeader('content-type')
    if (/text\/html/.test(contentType)) {
      contentElement.html(content)
      return
    }
    if (!isMarkdown(content)) {
      contentElement.empty().append($('<pre>').text(content))
      return
    }
    marked.setOptions({
      highlight: function (code, language) {
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
        return hljs.highlight(validLanguage, code).value
      }
    })
    var html = marked(content)
    contentElement.html(html).addClass('is-markdown')
  }).catch(e => {
    contentElement.html(`<div class="err text-muted m-5">File ${e.statusText}: <b>${decodeURI(file)}</b></div>`)
  })
}

var users = {}

/**
 * 加载用户名和头像
 */
function getUserInfo(origin, user, callback) {
  if (users[user]) {
    callback(users[user])
    return
  }
  $.post('/proxy/', {
    target: origin + '/api/v1/users/' + user
  }).then(function (response) {
    users[user] = {
      avatar: response.avatar_url,
      name: response.full_name || user
    }
    callback(users[user])
  }).catch(function () {
  })
}

function highlightCurrentFile(editUrl) {
  // 高亮当前文件
  var current = decodeURI(window.location.pathname)
  var catalog = $('#catalog')
  var origin = new URL(editUrl).origin
  catalog.find('span[data-user]').each(function () {
    var el = $(this)
    var user = el.attr('data-user')
    el.text(user[0]).attr('title', '用户 ' + user + ' 最后更新')
    getUserInfo(origin, user, function (info) {
      var title = '用户 ' + info.name + ' 最后更新'
      if (info.avatar) {
        el.before($('<img width="16" height="16"' +
          ' style="vertical-align: -3px;margin-right: 2px" title="' +
          title +
          '">')
          .attr('src', info.avatar))
        el.hide()
        return
      }
      el.text(info.name[0]).attr('title', title)
    })
  })
  catalog.find('a[href]').each(function () {
    var link = decodeURI($(this).attr('href'))
    if (link !== current) {
      return
    }
    $(this).removeAttr('href').parent().addClass('active')
    var msg = $(this).next()
    var user = msg.find('span[data-user]')
    $('#update-user').text(user.attr('data-user'))
    var date = user.next()
    $('#update-date').text(date.text())
      .attr('datetime', date.attr('datetime'))
      .attr('title', date.attr('datetime'))
    setTimeout(function () {
      getUserInfo(user.attr('data-user'), function (info) {
        if (info.avatar) {
          $('#update-user')
            .before($('<img width="16" height="16" style="vertical-align: -3px;margin-right: 2px">')
              .attr('src', info.avatar))
        }
        $('#update-user').text(info.name)
      })
    }, 0)
    return false
  })
}

function highlightLastUpdatedFile() {
  const items = $('#catalog').find('.item-content.is-file [datetime]')

  items.sort(function (a, b) {
    const timestampA = new Date($(a).attr('datetime'))
    const timestampB = new Date($(b).attr('datetime'))
    return timestampB - timestampA
  })

  const now = new Date()
  const day = 12 * 60 * 60 * 1000
  items.each(function () {
    const date = new Date($(this).attr('datetime'))
    if (now - date > day) {
      return
    }
    $(this).css('color', 'red')
  })
}
