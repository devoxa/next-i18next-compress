import { compressKey } from './compressKey'

function parseLocaleFile(string: string) {
  const json = JSON.parse(string)

  const compressedKeys: Record<string, string> = {}
  const compressedJson: Record<string, string> = {}

  Object.keys(json).forEach((key) => {
    const compressedKey = compressKey(key)

    // The compressed key already exists, throw a collision error
    if (compressedKeys[compressedKey]) {
      const message =
        `[next-i18next-compress] Compression collision detected: ` +
        `"${compressedKeys[compressedKey]}" and "${key}" compress to the same hash "${compressedKey}"`

      throw new Error(message)
    }

    compressedKeys[compressedKey] = key
    compressedJson[compressedKey] = json[key]
  })

  return compressedJson
}

export default { backend: { parse: parseLocaleFile } }
