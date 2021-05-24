const parseLocaleFile = require('../dist/fsBackend.js').parseLocaleFile

module.exports = () => ({ backend: { parse: parseLocaleFile } })
