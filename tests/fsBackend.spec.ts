import fsBackend from '../src/fsBackend'

const localeJson = {
  'Email address': 'E-Mail Adresse',
  'Forgot password': 'Passwort vergessen',
  'Or <1>start your 30-day free trial</1>':
    'Oder <1>beginne deine 30-Tage kostenlose Probephase</1>',
  'Your sign in credentials were incorrect.': 'Deine Anmeldedaten waren inkorrekt.',
}

describe('fsBackend', () => {
  it('correctly compresses the keys of the locale file', () => {
    const parseLocaleFile = fsBackend.backend.parse
    expect(parseLocaleFile(JSON.stringify(localeJson, null, 2))).toMatchSnapshot()
  })
})
