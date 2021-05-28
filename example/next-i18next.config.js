const nextI18nextCompressConfig = require('@devoxa/next-i18next-compress/config')

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },

  serializeConfig: false,
  ...nextI18nextCompressConfig(),
}
