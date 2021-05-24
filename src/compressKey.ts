import crypto from 'crypto'

export function compressKey(string: string, hashLength: number) {
  // Don't compress keys with interpolated React components
  if (string.match(/<.*?>/g)) return string

  // Strip whitespace to make keys extracted from Babel consistent with keys in locale files
  string = string.trim().replace(/\n+/g, ' ')

  // Hash the key's content into 6 characters. A collision may occur with a sufficiently
  // large locale file. Using 6 characters and a locale file with 100 keys, the probability of a
  // collision is about 0.029%.
  return crypto.createHash('sha256').update(string).digest('hex').slice(0, hashLength)
}
