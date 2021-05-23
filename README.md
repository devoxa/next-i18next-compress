<!-- Title -->
<h1 align="center">
  next-i18next-compress
</h1>

<!-- Description -->
<h4 align="center">
  Automatically compress locale keys for <code>next-i18next</code>.
</h4>

<!-- Badges -->
<p align="center">
  <a href="https://www.npmjs.com/package/@devoxa/next-i18next-compress">
    <img
      src="https://img.shields.io/npm/v/@devoxa/next-i18next-compress?style=flat-square"
      alt="Package Version"
    />
  </a>

  <a href="https://github.com/devoxa/next-i18next-compress/actions?query=branch%3Amaster+workflow%3A%22Continuous+Integration%22">
    <img
      src="https://img.shields.io/github/workflow/status/devoxa/next-i18next-compress/Continuous%20Integration?style=flat-square"
      alt="Build Status"
    />
  </a>

  <a href="https://codecov.io/github/devoxa/next-i18next-compress">
    <img
      src="https://img.shields.io/codecov/c/github/devoxa/next-i18next-compress/master?style=flat-square"
      alt="Code Coverage"
    />
  </a>
</p>

<!-- Quicklinks -->
<p align="center">
  <a href="#why--how">Why & How</a> •
  <a href="#installation">Installation</a> •
  <a href="#limitations">Limitations</a> •
  <a href="#contributors">Contributors</a> •
  <a href="#license">License</a>
</p>

<br>

## Why & How

When using natural keys (where the key is equal to the source language), the locale files can become
quite large because they include two locales at once (the source language and the translated
language). In addition, the JavaScript bundle also includes the source language in full.

This package automatically compresses the keys into 6-character long hashes and replaces them in the
JavaScript bundle and the locale files loaded on the server.

The results are a smaller JavaScript bundle and smaller locale files (which are embedded in the HTML
on the initial load and loaded as JSON for subsequent pages). **The total expected savings when
using natural keys are about 50% of the gzipped locale file size.**

## Installation

1. Install the package:

```bash
yarn add --dev @devoxa/next-i18next-compress
```

2. Update your `next-i18next.config.js`:

```js
const i18nextCompress = require('@devoxa/i18next-compress/config')

module.exports = {
  // Your usual `next-i18next` configuration
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },

  // Add the `next-i18next-compress` configuration
  ...i18nextCompress,
}
```

3. Create or update your `.babelrc`:

```json
{
  "presets": ["next/babel"],
  "plugins": ["@devoxa/i18next-compress/babel"]
}
```

## Limitations

1. If React components are interpolated inside of `<Trans>`, the key is not compressed. **Do not
   supply a `i18nKey` manually, this will cause a runtime error.**

2. If a key includes a namespace (like `ns:key`), the namespace will get lost during compression.
   **This will cause a runtime error.** If you need this functionality, please submit a PR.

3. Calling `t` with a variable argument is not supported, use a string literal instead. This will
   throw an error during build.

```diff
- t(variable)
+ t('string literal')
```

4. Calling `<Trans>` with a variable `i18nKey` attribute is not supported, use a string literal
   instead. This will throw an error during build.

```diff
- <Trans i18nKey={variable}>
+ <Trans i18nKey='string literal'>
```

5. Calling `<Trans>` with spread attributes is not supported, use explicit attributes instead. This
   will throw an error during build.

```diff
- <Trans {...variable}>
+ <Trans t={t}>
```

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://www.david-reess.de"><img src="https://avatars3.githubusercontent.com/u/4615516?v=4" width="75px;" alt=""/><br /><sub><b>David Reeß</b></sub></a><br /><a href="https://github.com/devoxa/next-i18next-compress/commits?author=queicherius" title="Code">💻</a> <a href="https://github.com/devoxa/next-i18next-compress/commits?author=queicherius" title="Documentation">📖</a> <a href="https://github.com/devoxa/next-i18next-compress/commits?author=queicherius" title="Tests">⚠️</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors)
specification. Contributions of any kind welcome!

## License

MIT
