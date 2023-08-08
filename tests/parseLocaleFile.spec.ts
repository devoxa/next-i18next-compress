import * as compressKeyModule from '../src/compressKey'
import { parseLocaleFile } from '../src/parseLocaleFile'

const compressKeySpy = jest.spyOn(compressKeyModule, 'compressKey')

const localeFileString = JSON.stringify({
  'Email address': 'E-Mail Adresse',
  'Forgot password': 'Passwort vergessen',
  'Or <1>start your 30-day free trial</1>':
    'Oder <1>beginne deine 30-Tage kostenlose Probephase</1>',
  'Your sign in credentials were incorrect.': 'Deine Anmeldedaten waren inkorrekt.',
  'Happy birthday, {{name}}!': 'Alles Gute zum Geburtstag, {{name}}!',
})

describe('parseLocaleFile', () => {
  test('correctly compresses the keys of the locale file', () => {
    expect(parseLocaleFile(localeFileString)).toMatchSnapshot()
  })

  test('can configure the length of the compressed key', () => {
    expect(parseLocaleFile(localeFileString, { hashLength: 16 })).toMatchSnapshot()
  })

  test('throws an error if there are any compression collisions', async () => {
    compressKeySpy.mockImplementation(() => 'foobar')
    expect(() => parseLocaleFile(localeFileString)).toThrowErrorMatchingSnapshot()
  })

  test('does nothing if running in development', () => {
    process.env.NODE_ENV = 'development'
    expect(parseLocaleFile(localeFileString)).toEqual(JSON.parse(localeFileString))
  })
})
