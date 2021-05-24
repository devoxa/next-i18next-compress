import { mergeDefaultOptions } from '../src/options'

describe('mergeDefaultOptions', () => {
  it('returns the default options', () => {
    expect(mergeDefaultOptions()).toMatchSnapshot()
  })

  it('returns the custom options', () => {
    expect(mergeDefaultOptions({ hashLength: 16 })).toMatchSnapshot()
  })

  it('throws an error on hashLength misconfiguration', () => {
    expect(() => mergeDefaultOptions({ hashLength: 2 })).toThrowErrorMatchingSnapshot()
    expect(() => mergeDefaultOptions({ hashLength: 1000 })).toThrowErrorMatchingSnapshot()
  })
})
