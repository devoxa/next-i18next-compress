const parseLocaleFile = require('../dist/src/parseLocaleFile.js').parseLocaleFile

module.exports = (pOptions) => ({
  backend: { parse: (string) => parseLocaleFile(string, pOptions) },
})
