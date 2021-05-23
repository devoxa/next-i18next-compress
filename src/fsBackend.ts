import { compressKey } from './compressKey'

function parseLocaleFile(string: string) {
  const json = JSON.parse(string)

  const compressedJson: Record<string, string> = {}
  Object.keys(json).forEach((key) => {
    compressedJson[compressKey(key)] = json[key]
  })

  return compressedJson
}

export default { backend: { parse: parseLocaleFile } }
