import { NodePath, transformSync } from '@babel/core'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Import JSX syntax support plugin
import jsxSyntaxPlugin from '@babel/plugin-syntax-jsx'
import * as BabelTypes from '@babel/types'
import { astToKey } from '../src/astToKey'
import { Babel } from '../src/babel'

function astToKeyFromCode(code: string) {
  let key

  function fakePlugin(babel: Babel) {
    const t = babel.types

    return {
      visitor: {
        CallExpression(path: NodePath<BabelTypes.CallExpression>) {
          if (!t.isIdentifier(path.node.callee, { name: 't' })) return
          key = astToKey([path.node.arguments[0]], { code })
        },

        JSXElement(path: NodePath<BabelTypes.JSXElement>) {
          if (!t.isJSXIdentifier(path.node.openingElement.name, { name: 'Trans' })) return
          key = astToKey(path.node.children, { code, jsx: true })
        },
      },
    }
  }

  transformSync(code, {
    plugins: [jsxSyntaxPlugin, fakePlugin],
    filename: 'client/src/test.jsx',
    cwd: '/tests/',
  })

  return key
}

describe('astToKey (functional)', () => {
  it('handles basic text', () => {
    const key = astToKeyFromCode(`
      t('Sign in to your account')
    `)

    expect(key).toEqual('Sign in to your account')
  })

  it('handles template literal', () => {
    const key = astToKeyFromCode(`
      t(\`Sign in to your account\`)
    `)

    expect(key).toEqual('Sign in to your account')
  })

  it('handles interpolated variable', () => {
    const key = astToKeyFromCode(`
      const name = 'Sam'
      t(\`Happy birthday, {{name}}!\`, { name })
    `)

    expect(key).toEqual('Happy birthday, {{name}}!')
  })

  it('handles multiple interpolated variables', () => {
    const key = astToKeyFromCode(`
      t(\`Big thanks to {{a}} and {{ b }}.\`)
    `)

    expect(key).toEqual('Big thanks to {{a}} and {{ b }}.')
  })
})

describe('astToKey (JSX)', () => {
  it('handles basic text', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>
        Sign in to your account
      </Trans>
    `)

    expect(key).toEqual('Sign in to your account')
  })

  it('handles basic text and a comment', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>
        Sign in to your account
        {/* but with a hidden comment */}
      </Trans>
    `)

    expect(key).toEqual('Sign in to your account')
  })

  it('handles basic text and explicit whitespace', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>
        Sign in to{'  '}your account{' '}
      </Trans>
    `)

    expect(key).toEqual('Sign in to  your account ')
  })

  it('handles basic text and stripped whitespace', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>
        Lorem ipsum dolor sit amet,
        consectetur adipiscing elit.
      </Trans>
    `)

    expect(key).toEqual('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
  })

  it('handles interpolated component', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>
        Or <NextLink href='/register'>start your 30-day free trial</NextLink>
      </Trans>
    `)

    expect(key).toEqual('Or <1>start your 30-day free trial</1>')
  })

  it('handles multiple interpolated components', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>
        You have read and acknowledge the{' '}
        <Link>Terms of Service</Link> and <Link>Privacy Notice</Link>.
      </Trans>
    `)

    expect(key).toEqual(
      'You have read and acknowledge the <2>Terms of Service</2> and <4>Privacy Notice</4>.'
    )
  })

  it('handles self-closing interpolated component', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>
        <Iceberg /> There's something in the water.
      </Trans>
    `)

    expect(key).toEqual("<0></0> There's something in the water.")
  })

  it('handles interpolated variable', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>Happy birthday, {{name}}!</Trans>
    `)

    expect(key).toEqual('Happy birthday, {{name}}!')
  })

  it('handles multiple interpolated variables', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>Big thanks to {{a}} and {{ b }}.</Trans>
    `)

    expect(key).toEqual('Big thanks to {{a}} and {{ b }}.')
  })

  it('handles interpolated variable inside of an interpolated component', () => {
    const key = astToKeyFromCode(`
      <Trans t={t}>Happy birthday, <Bold>birthday person {{name}}</Bold>!</Trans>
    `)

    expect(key).toEqual('Happy birthday, <1>birthday person {{name}}</1>!')
  })

  it('errors on interpolated expression', () => {
    expect(() =>
      astToKeyFromCode(`
        <Trans t={t}>They do travel in herds: {array.join(', ')}</Trans>
      `)
    ).toThrowErrorMatchingSnapshot()
  })

  it('errors on spread children', () => {
    expect(() =>
      astToKeyFromCode(`
        <Trans>Foo {...variable} bar</Trans>
      `)
    ).toThrowErrorMatchingSnapshot()
  })

  it('errors on fragment', () => {
    expect(() =>
      astToKeyFromCode(`
        <Trans>Foo <>bar</></Trans>
      `)
    ).toThrowErrorMatchingSnapshot()
  })

  it('errors on unknown AST type', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Forcing an invalid AST type
    expect(() => astToKey([{ type: 'Foobar' }], {})).toThrowErrorMatchingSnapshot()
  })
})
