import { TransformOptions, transformSync } from '@babel/core'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Import JSX syntax support plugin
import jsxSyntaxPlugin from '@babel/plugin-syntax-jsx'
import babelPlugin from '../src/babel'
import { Options } from '../src/options'

function transform(input: string, options?: Partial<Options>, babelOptions?: TransformOptions) {
  const output = transformSync(input, {
    plugins: [jsxSyntaxPlugin, options ? [babelPlugin, options] : [babelPlugin]],
    ...babelOptions,
  })

  return output?.code
}

describe('babel', () => {
  describe('`t` function', () => {
    it('correctly compresses the argument as the key (1)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t('Email address')} />
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('correctly compresses the argument as the key (2)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t(\`Email address\`)} />
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('correctly compresses the argument as the key (3)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const name = 'Sam'
          return <Input label={t(\`Happy birthday, \${name}\`)} />
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('correctly compresses the argument as the key (4)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t(\`Welcome to \${process.env.IP_CITY}!\`)} />
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

    it('errors for function calls with member expressions', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t(foo.bar)} />
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

    it('correctly compresses components with interpolated React components (1)', () => {
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

    it('correctly compresses components with interpolated React components (2)', () => {
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

    it('correctly compresses components with interpolated React components (3)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>
                <Link/> Forgot password
              </Trans>
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('correctly compresses components with interpolated React components (4)', () => {
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

    it('correctly compresses components with interpolated React components (5)', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey='Forgot password' />
              <Trans t={t} i18nKey='Forgot password'></Trans>
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('correctly compresses components with interpolated variable', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const name = 'Sam'
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>
                Happy birthday, {name}!
              </Trans>
            </Headline>
          )
        }
      `

      expect(transform(input)).toMatchSnapshot()
    })

    it('correctly compresses components with interpolated member expression', () => {
      const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>
                Welcome to {process.env.IP_CITY}!
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

  it('does nothing if the file is in node_modules', () => {
    const input = `
      export function ReactComponent() {
        const { t } = useTranslation('namespace')
        return (
          <Box>
            <Input label={t('Email address')} />
            <Trans t={t}>Forgot password</Trans>
          </Box>
        )
      }
    `

    expect(
      transform(input, undefined, { filename: 'client/node_modules/lodash/index.js' })
    ).toMatchSnapshot()
  })

  it('does nothing if running in development', () => {
    process.env.NODE_ENV = 'development'

    const input = `
      export function ReactComponent() {
        const { t } = useTranslation('namespace')
        return (
          <Box>
            <Input label={t('Email address')} />
            <Trans t={t}>Forgot password</Trans>
          </Box>
        )
      }
    `

    expect(transform(input)).toMatchSnapshot()
  })
})
