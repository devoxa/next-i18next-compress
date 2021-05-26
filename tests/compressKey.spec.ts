import { compressKey } from '../src/compressKey'

describe('compressKey', () => {
  it('compresses the key', () => {
    expect(compressKey('Email address', 6)).toEqual('f2488f')
    expect(compressKey('Sign up <1>here</1>', 6)).toEqual('6e4c86')
  })
})
