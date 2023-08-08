import * as BabelTypes from '@babel/types'
import colors from 'colors/safe'

export type AbstractSyntaxTree = Array<
  | BabelTypes.Expression
  | BabelTypes.SpreadElement
  | BabelTypes.JSXNamespacedName
  | BabelTypes.ArgumentPlaceholder
  | BabelTypes.TemplateElement
  | BabelTypes.TSType
  | BabelTypes.JSXText
  | BabelTypes.JSXExpressionContainer
  | BabelTypes.JSXSpreadChild
  | BabelTypes.JSXElement
  | BabelTypes.JSXFragment
  | BabelTypes.JSXEmptyExpression
>

export interface AstToKeyOptions {
  code: string
  jsx?: boolean
}

export function astToKey(ast: AbstractSyntaxTree, options: AstToKeyOptions): string {
  let key = ''

  // Ignore empty JSXText nodes, because they get stripped away by React
  // and interfere with getting the correct indexes for the JSXElement nodes.
  ast = ast.filter((astNode) => {
    if (astNode.type === 'JSXText' && astNode.value.trim() === '') return false
    return true
  })

  for (let i = 0; i !== ast.length; i++) {
    const astNode = ast[i]

    // This handles a normal string literal, like 'Foobar'
    if (astNode.type === 'StringLiteral') {
      key += astNode.value
      continue
    }

    // This handles a template string, like `Foobar`. It it build out of "quasis", which
    // are the template elements (= string literals), and expressions. We handle them all-in-one.
    if (astNode.type === 'TemplateLiteral') {
      key += astToKey([...astNode.expressions, ...astNode.quasis], options)
      continue
    }

    // This is a template element (= string literal) of a template string (inside of quasis).
    if (astNode.type === 'TemplateElement') {
      key += astNode.value.raw
      continue
    }

    // This is text inside of a JSX component. It may have whitespace, which is ignored
    // by React, so we have to clean it up to match what is expected.
    if (astNode.type === 'JSXText') {
      let value = astNode.value

      // Strip leading and trailing newlines
      value = value.replace(/^\n */g, '').replace(/\n *$/g, '')

      // Turn remaining newlines into spaces
      value = value.replace(/\n */g, ' ')

      key += value
      continue
    }

    // This is a JSX component, like `<Trans><Foo>...</Foo></Trans>`
    if (options.jsx && astNode.type === 'JSXElement') {
      const childNodesKey = astToKey(astNode.children, options)

      key += `<${i}>${childNodesKey}</${i}>`
      continue
    }

    // This is an interpolated expression, like `<Trans>Foo {...}</Trans>`
    if (astNode.type === 'JSXExpressionContainer') {
      key += astToKey([astNode.expression], options)
      continue
    }

    // This is an interpolated comment, like `<Trans>Foo {/* bar */}</Trans>`. We ignore these.
    if (astNode.type === 'JSXEmptyExpression') {
      continue
    }

    // This is an interpolated variable, like "t(`<Trans>Foo {{bar}}</Trans>`)" in JSX components.
    // "t('Foo {{bar}}')" in template strings is handled like a string literal.
    if (options.jsx && astNode.type === 'ObjectExpression') {
      /* c8 ignore next 3 */
      if (!astNode.start || !astNode.end) {
        throw new Error('Start or end of a AST node are missing, please file a bug report!')
      }

      // We slice the code out of the file instead of trying to recreate it from the AST
      // because I value my continued sanity.
      const astNodeCode = options.code.slice(astNode.start, astNode.end)

      key += `{${astNodeCode}}`
      continue
    }

    // We deliberately do not handle the following types:
    // - JSXSpreadChild is not supported by React/NextJS
    // - CallExpression is not supported `i18next`
    // - JSXFragment is not supported by `i18next`
    // - Identifier is generally a misuse (should be `{{variable}}` instead of `{variable}`)
    // - MemberExpression is generally a misuse (not supported by React)

    throw new UnsupportedAstTypeError(astNode, options.code)
  }

  return key
}

export class UnsupportedAstTypeError extends Error {
  constructor(astNode: { type: string; start?: number | null; end?: number | null }, code: string) {
    let message =
      `[next-i18next-compress] Unsupported AST type: ` +
      `We do not know how to handle "${astNode.type}"`

    if (code && astNode.start && astNode.end) {
      const codeRange = printCodeRange(code, astNode.start, astNode.end, 30)
      message += ` in this part of your code:\n${codeRange}`
    } else {
      message += '.'
    }

    super(message)
  }
}

function printCodeRange(code: string, start: number, end: number, padding: number) {
  const slicedStartPadding = code.slice(Math.max(0, start - padding), start)
  const slicedCode = code.slice(start, end)
  const slicedEndPadding = code.slice(end, Math.min(code.length, end + padding))

  /* c8 ignore next */
  const format = process.env.NODE_ENV === 'test' ? (x: string) => x : colors.red

  return slicedStartPadding + format(slicedCode) + slicedEndPadding
}
