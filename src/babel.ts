import * as BabelTypes from '@babel/types'
import { Visitor } from '@babel/traverse'
import { compressKey } from './compressKey'
import { mergeDefaultOptions, Options } from './options'

// We keep a set of processed nodes, because Babel may traverse the same node twice,
// which would cause us to compress the key twice.
const processedNodes = new Set()

export interface Babel {
  types: typeof BabelTypes
}

type State = { opts?: Partial<Options>; file: { opts: { filename?: string } } }

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

        // We don't support cases where the argument is not a string, because
        // we can't figure out what the actual value is easily.
        if (path.node.arguments[0].type !== 'StringLiteral') {
          return unsupportedCodeUse('`t(variable)` is not supported, use a string literal instead.')
        }

        // Compress the argument value (this is either the `i18nKey` or the natural key)
        path.node.arguments[0].value = compressKey(path.node.arguments[0].value, options.hashLength)

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

        // Only handle JSX elements with the name `Trans` and either one text child or no children
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
        let childrenValue
        if (path.node.children.length > 0) {
          childrenValue = childrenToKey(path.node.children as BabelTypes.JSXElement['children'])
        }

        // The key is either the `i18nKey` attribute or the child text node
        const key = (i18nKeyAttributeValue || childrenValue) as string

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

        if (path.node.children.length === 1 && path.node.children[0].type === 'JSXText') {
          // If there is only one text child, strip it out and remove the closing element.
          // `<Trans>Foo</Trans>` -> `<Trans i18nKey={...} />`
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

export function childrenToKey(children: BabelTypes.JSXElement['children']): string {
  let key = ''

  // We ignore empty text nodes since they get stripped by React
  children = children.filter((child) => {
    if (child.type === 'JSXText' && child.value.trim() === '') return false
    return true
  })

  for (let i = 0; i !== children.length; i++) {
    const child = children[i]

    if (child.type === 'JSXElement') {
      key += `<${i}>` + childrenToKey(child.children) + `</${i}>`
      continue
    }

    if (child.type === 'JSXText') {
      let text = child.value

      // Ignore trailing newlines
      text = text.replace(/\n *$/g, '')

      // Turn leading newlines into spaces
      text = text.replace(/\n */g, ' ')

      // Trim the start if we are the first child
      if (i === 0) {
        text = text.trimStart()
      }

      // Trim the end if we are the last child
      if (i === children.length - 1) {
        text = text.trimEnd()
      }

      key += text
      continue
    }

    if (child.type === 'JSXExpressionContainer') {
      // Take expressions like `{'  '}` exactly as they are
      if (child.expression.type === 'StringLiteral') {
        key += child.expression.value
        continue
      }

      // Handle interpolated variables by name
      if (child.expression.type === 'Identifier') {
        key += `{${child.expression.name}}`
        continue
      }

      // Ignore comments
      if (child.expression.type === 'JSXEmptyExpression') {
        continue
      }

      // We don't want to handle interpolated expressions. i18next-parser does, but it's a bit iffy
      // to do (they take the entire source and then slice the expression out).
      throw new Error('[next-i18next-compress] Unknown AST type: ' + child.expression.type)
    }

    if (child.type === 'JSXSpreadChild') {
      unsupportedCodeUse('`<Trans>{...variable}</Trans>` is not supported (by NextJS)')
    }

    if (child.type === 'JSXFragment') {
      unsupportedCodeUse('`<Trans>Text <>here</></Trans>` is not supported')
    }

    throw new Error('[next-i18next-compress] Unknown AST type: ' + child.type)
  }

  return key
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
