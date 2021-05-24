import fsBackend from '../src/fsBackend'
import * as compressKeyModule from '../src/compressKey'

const compressKeySpy = jest.spyOn(compressKeyModule, 'compressKey')

const localeFileString = JSON.stringify({
  'Email address': 'E-Mail Adresse',
  'Forgot password': 'Passwort vergessen',
  'Or <1>start your 30-day free trial</1>':
    'Oder <1>beginne deine 30-Tage kostenlose Probephase</1>',
  'Your sign in credentials were incorrect.': 'Deine Anmeldedaten waren inkorrekt.',
})

describe('fsBackend', () => {
  const parseLocaleFile = fsBackend.backend.parse

  it('correctly compresses the keys of the locale file', () => {
    expect(parseLocaleFile(localeFileString)).toMatchSnapshot()
  })

  it('throws an error if there are any compression collisions', async () => {
    compressKeySpy.mockImplementation(() => 'foobar')
    expect(() => parseLocaleFile(localeFileString)).toThrowErrorMatchingSnapshot()
  })
})
