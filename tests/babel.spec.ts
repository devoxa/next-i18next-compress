import { transformSync } from '@babel/core'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Import JSX syntax support plugin
import jsxSyntaxPlugin from '@babel/plugin-syntax-jsx'
import babelPlugin from '../src/babel'
import { Options } from '../src/options'

function transform(input: string, options?: Partial<Options>) {
  const output = transformSync(input, {
    plugins: [jsxSyntaxPlugin, options ? [babelPlugin, options] : [babelPlugin]],
  })

  return output?.code
}

describe('babel', () => {
  describe('`t` function', () => {
    it('correctly compresses the argument as the key', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t('Email address')} />
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('can configure the length of the compressed key', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t('Email address')} />
        }
      `

      expect(transform(input, { hashLength: 16 })).toMatchSnapshot()
    })

    it('ignores function calls with no arguments', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t()} />
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('errors for function calls with variable arguments', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const variable = 'Email address'
          return <Input label={t(variable)} />
        }
      `

      expect(() => transform(input)).toThrowErrorMatchingSnapshot()
    })
  })

  describe('`<Trans>` component', () => {
    it('correctly compresses the child text node as the key', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>Forgot password</Trans>
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('correctly compresses the i18nKey attribute as the key (1)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey='Forgot password'>
                This child text node should be completely ignored.
              </Trans>
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('correctly compresses the i18nKey attribute as the key (2)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey='Forgot password' />
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('can configure the length of the compressed key', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>Forgot password</Trans>
            </Headline>
          )
        }
      `

      expect(transform(input, { hashLength: 16 })).toMatchSnapshot()
    })

    it('ignores components with interpolated React components (1)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}><Link>Forgot password</Link></Trans>
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('ignores components with interpolated React components (2)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>
                Forgot <Link>password</Link>
              </Trans>
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('ignores components with interpolated React components (3)', () => {
      // TODO This is a bug right now, the i18nKey in the local file will get compressed,
      //      but the i18nKey in the JavaScript bundle is ignored. Fix this when we support
      //      compressing interpolated components!

      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey='Forgot password'>
                Forgot <Link>password</Link>
              </Trans>
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('errors for components with variable spreads', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const variable = { i18nKey: 'Forgot password' }
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} {...variable} />
            </Headline>
          )
        }
      `

      expect(() => transform(input)).toThrowErrorMatchingSnapshot()
    })

    it('errors for components with variable i18nKey attribute', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const variable = 'Forgot password'
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey={variable} />
            </Headline>
          )
        }
      `

      expect(() => transform(input)).toThrowErrorMatchingSnapshot()
    })
  })
})
