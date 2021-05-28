import * as BabelTypes from '@babel/types'

export type AbstractSyntaxTree = Array<
  | BabelTypes.Expression
  | BabelTypes.SpreadElement
  | BabelTypes.JSXNamespacedName
  | BabelTypes.ArgumentPlaceholder
  | BabelTypes.TemplateElement
  | BabelTypes.TSType
>

export interface AstToKeyOptions {
  code: string
  level?: number
}

export function astToKey(ast: AbstractSyntaxTree, pOptions: AstToKeyOptions): string {
  const options = { level: 0, ...pOptions }
  let key = ''

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
      const children = [...astNode.expressions, ...astNode.quasis].sort(
        (a, b) => (a.start || 0) - (b.start || 0)
      )

      key += astToKey(children, { ...options, level: options.level + 1 })
      continue
    }

    // This is a template element (= string literal) of a template string (inside of quasis).
    if (astNode.type === 'TemplateElement') {
      key += astNode.value.raw
      continue
    }

    // This is an interpolated variable, like `Foo ${bar}`. We do not allow this on the top level
    // to prevent calls like `t(bar)` which we can't do anything with.
    if (options.level > 0 && astNode.type === 'Identifier') {
      key += `{${astNode.name}}`
      continue
    }

    // This is an interpolated member expression, like `Foo ${bar.baz.boz}`. We do not allow this
    // on the top level to prevent calls like `t(bar.baz)` which we can't do anything with.
    if (options.level > 0 && astNode.type === 'MemberExpression') {
      // istanbul ignore next
      if (!astNode.start || !astNode.end) {
        throw new Error('Start and end of AST node are missing, please file a bug report!')
      }

      // We slice the code out of the file instead of trying to recreate it from the AST
      // because I value my continued sanity.
      const astNodeCode = options.code.slice(astNode.start, astNode.end)

      key += `{${astNodeCode}}`
      continue
    }

    // Deliberately do not handle the following types:
    // - CallExpression (not supported `i18next` as far as I know)

    throw new UnsupportedAstTypeError(astNode.type)
  }

  return key
}

class UnsupportedAstTypeError extends Error {
  constructor(type: string) {
    super('[next-i18next-compress] Unknown AST type: ' + type)
  }
}
