import crypto from 'crypto'

// Hash the key's content into 6 characters. A collision may occur with a sufficiently
// large locale file. Using 6 characters and a locale file with 100 keys, the probability of a
// collision is about 0.029%.
export function compressKey(string: string, hashLength: number) {
  // We collapse whitespace inside of variable interpolation (e.g. `{{ name }}` -> `{{name}}`),
  // since the whitespace is removed for JSX components during compilation.
  string = string.replace(/\{\{\s*([^}]*?)\s*\}\}/g, '{{$1}}')

  return crypto.createHash('sha256').update(string).digest('hex').slice(0, hashLength)
}
