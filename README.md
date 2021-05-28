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
  <a href="#troubleshooting">Troubleshooting</a> •
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

2. Make sure `next-i18next` is
   [setup to support unserializable plugins](https://github.com/isaachinman/next-i18next#unserialisable-configs)
   and update your `next-i18next.config.js`:

```js
const nextI18nextCompressConfig = require('@devoxa/next-i18next-compress/config')

module.exports = {
  // Your usual `next-i18next` configuration
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },
  serializeConfig: false,

  // Add the `next-i18next-compress` configuration
  ...nextI18nextCompressConfig(),
}
```

3. Create or update your `.babelrc`:

```json
{
  "presets": ["next/babel"],
  "plugins": ["@devoxa/next-i18next-compress/babel"]
}
```

4. You're done! The next time you run `next build`, your JavaScript bundle and locale files will be
   smaller. (Keep in mind that the compression is not active during development.)

## Configuration

When configuring this package, make sure to pass the options to both the configuration in
`next-i18next.config.js` as well as the babel plugin in `.babelrc`:

```js
// next-i18next.config.js
...nextI18nextCompressConfig({ hashLength: 8 }),

// .babelrc
"plugins": [["@devoxa/next-i18next-compress/babel", { "hashLength": 8 }]]
```

Available configuration options:

- `hashLength` (optional, defaults to `6`): The length of the resulting compressed key. Low values
  in combination with large locale files may cause collisions where two keys compress to the same
  hash, which will throw an error during build.

## Limitations

1. If a key includes a namespace (like `ns:key`), the namespace will get lost during compression.
   **This will cause a runtime error.** If you need this functionality, feel free to submit a PR!
2. Some syntax variants are not supported (for example calling `t` with a variable as the argument),
   which will throw an error during build.

## Troubleshooting

**My text shows up as a hash like `1b7396` or characters like `~~~`.**

This means that the translation for the uncompressed key is missing from your locale files. It is
recommended to use tools like [i18next-parser](https://github.com/i18next/i18next-parser) and
[i18next-test](https://github.com/devoxa/i18next-test) to ensure that translations exist for all
keys.

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
