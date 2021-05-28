import * as BabelTypes from '@babel/types'

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
  level?: number
}

export function astToKey(ast: AbstractSyntaxTree, pOptions: AstToKeyOptions): string {
  const options = { level: 0, ...pOptions }
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
      const childNodes = [...astNode.expressions, ...astNode.quasis]

      // istanbul ignore next
      if (childNodes.some((childNode) => !childNode.start || !childNode.end)) {
        throw new Error('Start or end of a AST node are missing, please file a bug report!')
      }

      key += astToKey(childNodes, { ...options, level: options.level + 1 })
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

      value = value.replace(/\n *$/g, '') // Ignore trailing newlines
      value = value.replace(/\n */g, ' ') // Turn remaining newlines into spaces
      if (i === 0) value = value.trimStart() // Trim the start if this is the first node
      if (i === ast.length - 1) value = value.trimEnd() // Trim the end if this is the last node

      key += value
      continue
    }

    // This is a JSX component, like `<Trans><Foo>...</Foo></Trans>`
    if (astNode.type === 'JSXElement') {
      const childNodesKey = astToKey(astNode.children, { ...options, level: options.level + 1 })

      key += `<${i}>${childNodesKey}</${i}>`
      continue
    }

    // This is an interpolated expression, like `<Trans>Foo {...}</Trans>`
    if (astNode.type === 'JSXExpressionContainer') {
      key += astToKey([astNode.expression], { ...options, level: options.level + 1 })
      continue
    }

    // This is an interpolated comment, like `<Trans>Foo {/* bar */}</Trans>`. We ignore these.
    if (astNode.type === 'JSXEmptyExpression') {
      continue
    }

    // We still have to add support for the following types:
    // - Identifier
    // - MemberExpression

    // We deliberately do not handle the following types:
    // - JSXSpreadChild is not supported by React/NextJS
    // - CallExpression is not supported `i18next`
    // - JSXFragment is not supported by `i18next`

    throw new UnsupportedAstTypeError(astNode, options.code)
  }

  return key
}

export class UnsupportedAstTypeError extends Error {
  constructor(astNode: { type: string; start: number | null; end: number | null }, code: string) {
    let message =
      `[next-i18next-compress] Unsupported AST type: ` +
      `We do not know how to handle "${astNode.type}"`

    if (code && astNode.start && astNode.end) {
      const start = Math.max(0, astNode.start - 30)
      const end = Math.min(code.length, astNode.end + 30)

      message += ` in this part of your code:\n` + code.slice(start, end)
    } else {
      message += '.'
    }

    super(message)
  }
}
