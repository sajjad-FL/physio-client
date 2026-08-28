/**
 * Store Puppeteer's Chrome download inside node_modules/.cache.
 * Render (and most CI) caches node_modules between builds but wipes the repo
 * checkout and the home directory — so this is the only location where the
 * ~170MB Chrome download survives to the next deploy instead of re-downloading
 * every time.
 */
const { join } = require('path')

module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
}
