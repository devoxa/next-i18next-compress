import * as BabelTypes from '@babel/types'
import { Visitor } from '@babel/traverse'
import { compressKey } from './compressKey'
import { mergeDefaultOptions, Options } from './options'
import { AbstractSyntaxTree, astToKey } from './astToKey'

// We keep a set of processed nodes, because Babel may traverse the same node twice,
// which would cause us to compress the key twice.
const processedNodes = new Set()

export interface Babel {
  types: typeof BabelTypes
}

interface State {
  opts?: Partial<Options>
  file: { opts: { filename?: string }; code: string }
}

export default function nextI18nextCompressBabelPlugin(
  babel: Babel
): { name: string; visitor: Visitor } {
  const t = babel.types

  return {
    name: 'next-i18next-compress',

    visitor: {
      CallExpression(path, _state) {
        const state = _state as State

        // Do not process any files in development
        if (process.env.NODE_ENV === 'development') {
          return
        }

        // Do not process any files in `node_modules/`, since this can cause issues with minified code
        if (state.file.opts.filename && state.file.opts.filename.includes('/node_modules/')) {
          return
        }

        const options = mergeDefaultOptions(state.opts)

        // istanbul ignore next
        if (processedNodes.has(path.node)) return

        // Only handle functions with the name `t` and at least one argument
        if (!t.isIdentifier(path.node.callee, { name: 't' })) return
        if (path.node.arguments.length === 0) return

        // Get the key from the AST of the first argument
        const key = astToKey([path.node.arguments[0]] as AbstractSyntaxTree, {
          code: state.file.code,
        })

        // Generate the new argument with the compressed key
        const keyArgument = {
          type: 'StringLiteral',
          value: compressKey(key, options.hashLength),
        }

        // Overwrite the existing argument with the new one
        path.node.arguments[0] = keyArgument as any // eslint-disable-line @typescript-eslint/no-explicit-any

        processedNodes.add(path.node)
      },

      JSXElement(path, _state) {
        const state = _state as State

        // Do not process any files in development
        if (process.env.NODE_ENV === 'development') {
          return
        }

        // Do not process any files in `node_modules/`, since this can cause issues with minified code
        if (state.file.opts.filename && state.file.opts.filename.includes('/node_modules/')) {
          return
        }

        const options = mergeDefaultOptions(state.opts)

        // istanbul ignore next
        if (processedNodes.has(path.node)) return

        // Only handle JSX elements with the name `Trans`
        if (!t.isJSXIdentifier(path.node.openingElement.name, { name: 'Trans' })) return

        // We don't support cases where a variable is spread into the attributes,
        // because there might be a `i18nKey` in it that we might overwrite.
        const elementMixedAttributes = path.node.openingElement.attributes
        if (elementMixedAttributes.some((x) => x.type === 'JSXSpreadAttribute')) {
          return unsupportedCodeUse(
            '`<Trans {...variable}>` is not supported, use explicit attributes instead.'
          )
        }
        const elementJsxAttributes = elementMixedAttributes as Array<BabelTypes.JSXAttribute>

        // Get the content of the `i18nKey` attribute, if it exists and has a value
        let i18nKeyAttributeValue
        const i18nKeyAttribute = elementJsxAttributes.find((x) => x.name.name === 'i18nKey')
        if (i18nKeyAttribute && i18nKeyAttribute.value) {
          // We don't support cases where the attribute is not a string, because
          // we can't figure out what the actual value is easily.
          if (i18nKeyAttribute.value.type !== 'StringLiteral') {
            return unsupportedCodeUse(
              '`<Trans i18nKey={variable}>` is not supported, use a string literal instead.'
            )
          }

          i18nKeyAttributeValue = i18nKeyAttribute.value.value
        }

        // Get the key based on the children, if they exist
        let childrenKey
        if (path.node.children.length > 0) {
          childrenKey = astToKey(path.node.children as AbstractSyntaxTree, {
            code: state.file.code,
          })
        }

        // The key is either the `i18nKey` attribute or the child text node
        const key = (i18nKeyAttributeValue || childrenKey) as string

        // Generate the new `i18nKey` attribute with the compressed key
        const keyAttribute = {
          type: 'JSXAttribute',
          name: { type: 'JSXIdentifier', name: 'i18nKey' },
          value: { type: 'StringLiteral', value: compressKey(key, options.hashLength) },
        }

        // Strip the element of any existing `i18nKey` attribute and insert the new one
        path.node.openingElement.attributes = path.node.openingElement.attributes.filter(
          (x) => x.type === 'JSXAttribute' && x.name.name !== 'i18nKey'
        )
        path.node.openingElement.attributes.push(keyAttribute as any) // eslint-disable-line @typescript-eslint/no-explicit-any

        const canTurnIntoSelfClosing =
          path.node.children.length === 0 ||
          (path.node.children.length === 1 && path.node.children[0].type === 'JSXText')

        if (canTurnIntoSelfClosing) {
          // If there is no children or only one text child, turn it into a self-closing element
          // with no children or additional closing element.
          // `<Trans>Foo</Trans>` -> `<Trans i18nKey='...' />`
          path.node.children = []
          delete path.node.closingElement
          path.node.openingElement.selfClosing = true
        } else {
          // If there is something else, at least compress the text nodes to single characters
          // since they will be replaced by the translated text.
          // `<Trans>Foo <Link>Bar</Link></Trans>` -> `<Trans i18nKey={...}>~<Link>~</Link></Trans>`
          compressChildTextNodes(path.node.children as BabelTypes.JSXElement['children'])
        }

        processedNodes.add(path.node)
      },
    },
  }
}

function unsupportedCodeUse(message: string) {
  throw new Error('[next-i18next-compress] Unsupported code use: ' + message)
}

function compressChildTextNodes(children: BabelTypes.JSXElement['children']): void {
  for (let i = 0; i !== children.length; i++) {
    const child = children[i]

    if (child.type === 'JSXElement') {
      compressChildTextNodes(child.children)
      continue
    }

    // We ignore empty text nodes since they get stripped by React
    if (child.type === 'JSXText' && child.value.trim() !== '') {
      child.value = '~'
      continue
    }
  }
}
