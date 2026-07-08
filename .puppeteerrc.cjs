/**
 * Store Puppeteer's Chrome download inside the project instead of ~/.cache.
 * Render (and most CI) caches node_modules but not the home directory, so the
 * default location produces "Could not find Chrome" on cached builds.
 */
const { join } = require('path')

module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
}
