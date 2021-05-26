import { compressKey } from './compressKey'
import { mergeDefaultOptions, Options } from './options'

export function parseLocaleFile(string: string, pOptions?: Options) {
  const options = mergeDefaultOptions(pOptions)
  const json = JSON.parse(string)

  // Do not process any files in development
  if (process.env.NODE_ENV === 'development') {
    return json
  }

  const compressedKeys: Record<string, string> = {}
  const compressedJson: Record<string, string> = {}

  Object.keys(json).forEach((key) => {
    const compressedKey = compressKey(key, options.hashLength)

    // The compressed key already exists, throw a collision error
    if (compressedKeys[compressedKey]) {
      const message =
        `[next-i18next-compress] Compression collision: ` +
        `"${compressedKeys[compressedKey]}" and "${key}" compress to the same hash "${compressedKey}".` +
        `Try increasing the "hashLength" option or splitting your locale file into multiple namespaces.`

      throw new Error(message)
    }

    compressedKeys[compressedKey] = key
    compressedJson[compressedKey] = json[key]
  })

  return compressedJson
}
