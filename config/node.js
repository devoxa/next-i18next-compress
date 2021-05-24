const parseLocaleFile = require('../dist/fsBackend.js').parseLocaleFile

module.exports = (pOptions) => ({
  backend: { parse: (string) => parseLocaleFile(string, pOptions) },
})
