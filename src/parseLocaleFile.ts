import { compressKey } from './compressKey'
import { mergeDefaultOptions, Options } from './options'

export function parseLocaleFile(string: string, pOptions?: Options) {
  const options = mergeDefaultOptions(pOptions)
  const json = JSON.parse(string)

  const compressedKeys: Record<string, string> = {}
  const compressedJson: Record<string, string> = {}

  Object.keys(json).forEach((key) => {
    const compressedKey = compressKey(key, options.hashLength)

    // The compressed key already exists, throw a collision error
    if (compressedKeys[compressedKey]) {
      const message =
        `[next-i18next-compress] Compression collision detected: ` +
        `"${compressedKeys[compressedKey]}" and "${key}" compress to the same hash "${compressedKey}".` +
        `Try increasing the "hashLength" option or splitting your locale file.`

      throw new Error(message)
    }

    compressedKeys[compressedKey] = key
    compressedJson[compressedKey] = json[key]
  })

  return compressedJson
}
