import { compressKey } from '../src/compressKey'

describe('compressKey', () => {
  it('compresses the key', () => {
    expect(compressKey('Email address', 6)).toEqual('f2488f')
  })

  it('compresses the key without whitespace', () => {
    expect(compressKey('Email  \naddress', 6)).toEqual('f2488f')
  })

  it('ignores keys with interpolated React components', () => {
    expect(compressKey('Sign up <1>here</1>', 6)).toEqual('Sign up <1>here</1>')
  })
})
