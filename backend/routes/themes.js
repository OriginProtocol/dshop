const { getAvailableThemes } = require('../logic/themes')

module.exports = function (router) {
  /**
   * Returns a list of available themes,
   * Requires a server restart to pick up changes
   */
  router.get('/themes', (req, res) => {
    res.json({
      success: true,
      data: getAvailableThemes()
    })
  })
}
