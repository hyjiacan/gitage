module.exports = {
  async help(req, res) {
    await res.render('misc/help.html')
  }
}
