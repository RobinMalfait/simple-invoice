import { randomUUID } from 'crypto'
import type { ChildNode } from 'domhandler'
import * as htmlparser2 from 'htmlparser2'
import type { TokenizerAndRendererExtension } from 'marked'
import * as marked from 'marked'
import { dedent } from '~/utils/dedent'

let classified: TokenizerAndRendererExtension = {
  name: 'classified',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/\|\|([\s\S]*?)\|\|/)?.index
  },
  tokenizer(src: string) {
    let rule = /^\|\|([\s\S]*?)\|\|/
    let match = rule.exec(src)
    if (!match) return undefined

    return {
      type: 'classified',
      raw: match[0],
      text: match[1],
    }
  },
  renderer(token) {
    if (token.text.trim() === '') return ''
    return `<span class="relative classified:[&_img]:brightness-0 classified:select-none classified:bg-zinc-950 classified:text-zinc-950">${token.text}</span>`
  },
}

marked.use({
  extensions: [classified],
})

export function parseMarkdown(value: string): string {
  let html = marked.parse(dedent(value.replace(/\t/g, '{{TAB}}')), { breaks: true }).trim()
  return html.replace(/\{\{TAB\}\}/g, '\t')
}

type JSXNode = { tag: string; props: Record<string | symbol, any>; children: JSX[] }
type JSX = JSXNode | null

function jsxify(node: ChildNode): JSX {
  if (node.type === 'text') {
    if (node.data.trim() === '') return null
    return { tag: '#text', props: { value: node.data }, children: [] }
  }

  if (node.type === 'tag') {
    return {
      tag: node.name,
      props: Object.fromEntries(
        node.attributes.map((attr) => {
          return [attr.name, attr.value]
        }),
      ),
      children: Array.from(node.childNodes).flatMap((child) => {
        return jsxify(child) ?? []
      }),
    }
  }

  throw new Error(`Unknown node type: ${node.type}`)
}

let GROUP_ID_KEY = 'data-group-id'

function expandRecursively(ast: JSX | JSX[]): JSX[] {
  if (Array.isArray(ast)) {
    return ast.flatMap((child) => {
      return expandRecursively(child)
    })
  }

  if (ast === null) {
    return []
  }

  let children: [number, JSX][] = []

  for (let [idx, child] of ast.children.entries()) {
    if (child === null) continue
    if (child.children.length === 0) {
      children.push([idx, child])
      continue
    }

    // Table rows should not be expanded
    if (child.tag === 'tr') {
      children.push([idx, child])
      continue
    }

    // Mark list items with nested lists as having children
    // This way we can move the `li` to the next page, if none of the nested lists' items are on the
    // current page
    if (
      child.tag === 'li' &&
      child.children.some((child) => {
        return child?.tag === 'ol' || child?.tag === 'ul'
      })
    ) {
      child.props['data-has-children'] = true
    }

    for (let grandChild of expandRecursively(child)) {
      children.push([idx, grandChild])
    }
  }

  let groupId = typeof window === 'undefined' ? randomUUID() : window.crypto.randomUUID()

  let roots = []
  for (let [idx, child] of children) {
    let clone = structuredClone(ast)
    clone.props[GROUP_ID_KEY] = groupId

    if (clone.tag === 'ol' || clone.tag === 'ul') {
      if (clone.props.start) {
        clone.props.start = (Number(clone.props.start) + idx).toString()
      } else {
        clone.props.start = (idx + 1).toString()
      }
    }
    clone.children = [child]
    roots.push(clone)
  }

  return roots
}

export function expand(html: string): JSX[] {
  let dom = htmlparser2.parseDocument(html)
  return expandRecursively(Array.from(dom.childNodes).map(jsxify))
}

export function paginate(items: JSX[], pages: number[]): JSX[][] {
  let clone = items.slice()
  let split = pages.map((page) => {
    return clone.splice(0, page)
  })

  for (let i = split.length - 2; i >= 0; i--) {
    let again = true
    while (again) {
      again = false

      let last = split[i][split[i].length - 1]
      if (!last) break

      // Move page headings to the next page if they are the last element on the page
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(last?.tag)) {
        if (!Array.isArray(split[i + 1])) break

        split[i + 1].unshift(split[i].pop()!)
        again = true
        continue
      }

      // Move lists to the next page if they are the last element on the page and have children
      if (last.tag === 'ol' || last.tag === 'ul') {
        if (
          last.children.length === 1 &&
          last.children[0]?.tag === 'li' &&
          last.children[0].props['data-has-children'] &&
          !last.children[0].children.some((child) => {
            return child?.tag === 'ol' || child?.tag === 'ul'
          })
        ) {
          if (!Array.isArray(split[i + 1])) break

          split[i + 1].unshift(split[i].pop()!)
          again = true
          continue
        }
      }
    }
  }

  return split.filter((page) => {
    return page.length > 0
  })
}

export function collapse(ast: JSX[]): JSX[] {
  let byGroupId = new Map<string, JSX>()

  let returnValue: JSX[] = []
  for (let node of ast) {
    if (node === null) continue
    let key = node.props[GROUP_ID_KEY]

    // Leaf node
    if (key === undefined) {
      returnValue.push(node)
      continue
    }

    if (byGroupId.has(key)) {
      let prev = byGroupId.get(key)!
      for (let child of node.children) {
        if (prev.children.includes(child)) {
          continue
        }

        prev.children.push(child)
      }
    } else {
      let clone = structuredClone(node)
      byGroupId.set(key, clone)
      returnValue.push(clone)
    }
  }

  for (let parent of returnValue) {
    if (parent === null) continue

    if (
      parent.tag === 'li' &&
      parent.children.length >= 1 &&
      parent.children[0] !== null &&
      ['ul', 'ol'].includes(parent.children[0].tag)
    ) {
      parent.props.class = 'list-none'
    }

    if (parent.children.length === 0) continue
    parent.children = collapse(parent.children)
  }

  return returnValue.map((node) => {
    if (node === null) return null
    delete node.props[GROUP_ID_KEY]
    delete node.props['data-has-children']
    return node
  })
}

export function stringify(ast: JSX | JSX[]): string {
  if (Array.isArray(ast))
    return ast
      .map((node) => {
        return stringify(node)
      })
      .join('\n')
  if (ast === null) return ''
  if (ast.tag === '#text') return ast.props.value
  let children = ast.children
    .map((child) => {
      return stringify(child)
    })
    .join('')
  let attributes = Object.entries(ast.props)
    .map(([key, value]) => {
      return `${key}="${value}"`
    })
    .join(' ')
  return `<${ast.tag}${attributes.length > 0 ? ` ${attributes}` : ''}>${children}</${ast.tag}>`
}
