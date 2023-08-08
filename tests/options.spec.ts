import { mergeDefaultOptions } from '../src/options'

describe('mergeDefaultOptions', () => {
  test('returns the default options', () => {
    expect(mergeDefaultOptions()).toMatchSnapshot()
  })

  test('returns the custom options', () => {
    expect(mergeDefaultOptions({ hashLength: 16 })).toMatchSnapshot()
  })

  test('throws an error on hashLength misconfiguration', () => {
    expect(() => mergeDefaultOptions({ hashLength: 2 })).toThrowErrorMatchingSnapshot()
    expect(() => mergeDefaultOptions({ hashLength: 1000 })).toThrowErrorMatchingSnapshot()
  })
})
