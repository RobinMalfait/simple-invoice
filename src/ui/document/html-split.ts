import { randomUUID } from 'crypto'
import type { ChildNode } from 'domhandler'
import * as htmlparser2 from 'htmlparser2'

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
      props: Object.fromEntries(node.attributes.map((attr) => [attr.name, attr.value])),
      children: Array.from(node.childNodes).flatMap((child) => jsxify(child) ?? []),
    }
  }

  throw new Error(`Unknown node type: ${node.type}`)
}

let GROUP_ID_KEY = 'data-group-id'

function expandRecursively(ast: JSX | JSX[]): JSX[] {
  if (Array.isArray(ast)) {
    return ast.flatMap((child) => expandRecursively(child))
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

function paginate(ast: JSX[], pages: number[]): JSX[][] {
  return pages.map((page) => ast.splice(0, page))
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
    return node
  })
}

export function stringify(ast: JSX | JSX[]): string {
  if (Array.isArray(ast)) return ast.map((node) => stringify(node)).join('\n')
  if (ast === null) return ''
  if (ast.tag === '#text') return ast.props.value
  let children = ast.children.map((child) => stringify(child)).join('')
  let attributes = Object.entries(ast.props)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')
  return `<${ast.tag}${attributes.length > 0 ? ` ${attributes}` : ''}>${children}</${ast.tag}>`
}

export function split(html: string, pages: number[]): string[] {
  let expanded = expand(html)
  let paginated = paginate(expanded, pages)
  let collapsed = paginated.map((page) => collapse(page))
  let stringified = collapsed.map((page) => stringify(page))
  return stringified
}
