import * as BabelTypes from '@babel/types'
import { Visitor } from '@babel/traverse'
import { compressKey } from './compressKey'

// We keep a set of processed nodes, because Babel may traverse the same node twice,
// which would cause us to compress the key twice.
const processedNodes = new Set()

interface Babel {
  types: typeof BabelTypes
}

export default function nextI18nextCompressBabelPlugin(
  babel: Babel
): { name: string; visitor: Visitor } {
  const t = babel.types

  return {
    name: 'next-i18next-compress',

    visitor: {
      CallExpression(path) {
        // istanbul ignore next
        if (processedNodes.has(path.node)) return

        // Only handle functions with the name `t` and at least one argument
        if (!t.isIdentifier(path.node.callee, { name: 't' })) return
        if (path.node.arguments.length === 0) return

        // We don't support cases where the argument is not a string, because
        // we can't figure out what the actual value is easily.
        if (path.node.arguments[0].type !== 'StringLiteral') {
          return unsupportedPluginUsage(
            '`t(variable)` is not supported, has to be a string literal'
          )
        }

        // Compress the argument value (this is either the `i18nKey` or the natural key)
        path.node.arguments[0].value = compressKey(path.node.arguments[0].value, 6)

        processedNodes.add(path.node)
      },

      JSXElement(path) {
        // istanbul ignore next
        if (processedNodes.has(path.node)) return

        // Only handle JSX elements with the name `Trans` and either one text child or no children
        if (!t.isJSXIdentifier(path.node.openingElement.name, { name: 'Trans' })) return
        if (path.node.children.length > 1) return
        if (path.node.children.some((x) => x.type !== 'JSXText')) return

        // We don't support cases where a variable is spread into the attributes,
        // because there might be a `i18nKey` in it that we might overwrite.
        const elementMixedAttributes = path.node.openingElement.attributes
        if (elementMixedAttributes.some((x) => x.type === 'JSXSpreadAttribute')) {
          return unsupportedPluginUsage('`<Trans {...variable}>` is not supported')
        }
        const elementJsxAttributes = elementMixedAttributes as Array<BabelTypes.JSXAttribute>

        // Get the content of the `i18nKey` attribute, if it exists and has a value
        let i18nKeyAttributeValue
        const i18nKeyAttribute = elementJsxAttributes.find((x) => x.name.name === 'i18nKey')
        if (i18nKeyAttribute && i18nKeyAttribute.value) {
          // We don't support cases where the attribute is not a string, because
          // we can't figure out what the actual value is easily.
          if (i18nKeyAttribute.value.type !== 'StringLiteral') {
            return unsupportedPluginUsage(
              '`<Trans i18nKey={variable}>` is not supported, has to be a string literal'
            )
          }

          i18nKeyAttributeValue = i18nKeyAttribute.value.value
        }

        // Get the value of the child text node, if it exists
        let childTextNodeValue
        if (path.node.children[0] && path.node.children[0].type === 'JSXText') {
          childTextNodeValue = path.node.children[0].value
        }

        // The key is either the `i18nKey` attribute or the child text node
        const key = (i18nKeyAttributeValue || childTextNodeValue) as string

        // Generate the new `i18nKey` attribute with the compressed key
        const keyAttribute = {
          type: 'JSXAttribute',
          name: { type: 'JSXIdentifier', name: 'i18nKey' },
          value: { type: 'StringLiteral', value: compressKey(key, 6) },
        }

        // Strip the element of any existing `i18nKey` attribute and insert the new one
        path.node.openingElement.attributes = path.node.openingElement.attributes.filter(
          (x) => x.type === 'JSXAttribute' && x.name.name !== 'i18nKey'
        )
        path.node.openingElement.attributes.push(keyAttribute as any) // eslint-disable-line @typescript-eslint/no-explicit-any

        // Strip the element of the children and the closing element, since they are
        // now unused. `<Trans>Foo</Trans>` -> `<Trans i18nKey={...} />`
        path.node.children = []
        delete path.node.closingElement
        path.node.openingElement.selfClosing = true

        processedNodes.add(path.node)
      },
    },
  }
}

function unsupportedPluginUsage(message: string) {
  throw new Error('[next-i18next-compress] Unsupported usage detected: ' + message)
}
