module.exports = {
  async about(req, res) {
    await res.render('misc/about.html')
  }
}
