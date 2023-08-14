/**
 * @jest-environment jsdom
 */
import { dedent } from '~/utils/dedent'
import { collapse, expand, paginate, parseMarkdown, stringify } from './document'

global.DOMParser = window.DOMParser
{
  let x = 0
  global.window.crypto.randomUUID = () => (x++).toString()
}
global.structuredClone = (x: any) => JSON.parse(JSON.stringify(x))

let html = String.raw
let md = String.raw

function split(html: string, pages: number[]): string[] {
  let expanded = expand(html)
  let paginated = paginate(expanded, pages)
  let collapsed = paginated.map((page) => collapse(page))
  let stringified = collapsed.map((page) => stringify(page))
  return stringified
}

it('should split simple html', () => {
  expect(
    split(
      dedent(html`
        <p>Foo</p>
        <p>Bar</p>
      `),
      [1, 1],
    ),
  ).toEqual(['<p>Foo</p>', '<p>Bar</p>'])
})

it('should split ordered lists', () => {
  expect(
    split(
      dedent(html`
        <ol>
          <li>Foo</li>
          <li>Bar</li>
        </ol>
      `),
      [1, 1],
    ),
  ).toEqual(['<ol start="1"><li>Foo</li></ol>', '<ol start="2"><li>Bar</li></ol>'])
})

it('should split Unordered lists', () => {
  expect(
    split(
      dedent(html`
        <ul>
          <li>Foo</li>
          <li>Bar</li>
        </ul>
      `),
      [1, 1],
    ),
  ).toEqual(['<ul start="1"><li>Foo</li></ul>', '<ul start="2"><li>Bar</li></ul>'])
})

it('should split lists and respect the start value', () => {
  expect(
    split(
      dedent(html`
        <ol start="4">
          <li>Foo</li>
          <li>Bar</li>
        </ol>
      `),
      [1, 1],
    ),
  ).toEqual(['<ol start="4"><li>Foo</li></ol>', '<ol start="5"><li>Bar</li></ol>'])
})

it('should split nested lists', () => {
  expect(
    split(
      dedent(html`
        <ol>
          <li>Foo</li>
          <li>Bar</li>
          <li>Baz</li>
          <li>
            <span>Other:</span>
            <ol>
              <li>A</li>
              <li>B</li>
              <li>C</li>
            </ol>
          </li>
        </ol>
      `),
      [1, 1, 1, 1, 1, 1, 1],
    ),
  ).toEqual([
    '<ol start="1"><li>Foo</li></ol>',
    '<ol start="2"><li>Bar</li></ol>',
    '<ol start="3"><li>Baz</li></ol>',
    '<ol start="4"><li><span>Other:</span><ol start="1"><li>A</li></ol></li></ol>',
    '<ol start="4"><li class="list-none"><ol start="2"><li>B</li></ol></li></ol>',
    '<ol start="4"><li class="list-none"><ol start="3"><li>C</li></ol></li></ol>',
  ])
})

it('should split nested lists with normal text not wrapped in an element (Other)', () => {
  expect(
    split(
      dedent(html`
        <ol>
          <li>Foo</li>
          <li>Bar</li>
          <li>Baz</li>
          <li>
            Other:
            <ol>
              <li>A</li>
              <li>B</li>
              <li>C</li>
            </ol>
          </li>
        </ol>
      `),
      [1, 1, 1, 1, 1, 1, 1],
    ),
  ).toEqual([
    '<ol start="1"><li>Foo</li></ol>',
    '<ol start="2"><li>Bar</li></ol>',
    '<ol start="3"><li>Baz</li></ol>',
    `<ol start=\"4\"><li>
    Other:
    <ol start="1"><li>A</li></ol></li></ol>`,
    '<ol start="4"><li class="list-none"><ol start="2"><li>B</li></ol></li></ol>',
    '<ol start="4"><li class="list-none"><ol start="3"><li>C</li></ol></li></ol>',
  ])
})

it('should split nested lists over 2 pages', () => {
  expect(
    split(
      dedent(html`
        <ol>
          <li>Foo</li>
          <li>Bar</li>
          <li>Baz</li>
          <li>
            <span>Qux:</span>
            <ol>
              <li>A</li>
              <li>B</li>
              <li>C</li>
            </ol>
          </li>
        </ol>
      `),
      [5, 2],
    ),
  ).toEqual([
    '<ol start="1"><li>Foo</li><li>Bar</li><li>Baz</li><li><span>Qux:</span><ol start="1"><li>A</li></ol></li></ol>',
    '<ol start="4"><li class="list-none"><ol start="2"><li>B</li><li>C</li></ol></li></ol>',
  ])
})

it('should split tables by rows instead of individual DOM nodes', () => {
  expect(
    split(
      dedent(html`
        <table>
          <thead>
            <tr>
              <th>Column 1</th>
              <th>Column 2</th>
              <th>Column 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>A</td>
              <td>B</td>
              <td>C</td>
            </tr>
            <tr>
              <td>D</td>
              <td>E</td>
              <td>F</td>
            </tr>
            <tr>
              <td>G</td>
              <td>H</td>
              <td>I</td>
            </tr>
          </tbody>
        </table>
      `),
      [2, 2],
    ),
  ).toEqual([
    '<table><thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead><tbody><tr><td>A</td><td>B</td><td>C</td></tr></tbody></table>',
    '<table><tbody><tr><td>D</td><td>E</td><td>F</td></tr><tr><td>G</td><td>H</td><td>I</td></tr></tbody></table>',
  ])
})

it('should move titles to the next page if they are the last item on the page', () => {
  expect(
    split(
      parseMarkdown(md`
        # Foo

        Lorem ipsum dolor sit amet
      `),
      [1, 1],
    ),
  ).toEqual([
    `<h1>Foo</h1>
<p>Lorem ipsum dolor sit amet</p>`,
  ])
})

it('should move "title" elements with children to the next page if the title is the last item on the page (and therefore the children are on the next page)', () => {
  expect(
    split(
      parseMarkdown(md`
        1. Foo

           - Foo 1
           - Foo 2
           - Foo 3

        2. Bar

           - Bar 1
           - Bar 2
           - Bar 3
      `),
      [5, 4],
    ),
  ).toEqual([
    '<ol start="1"><li><p>Foo</p><ul start="1"><li>Foo 1</li><li>Foo 2</li><li>Foo 3</li></ul></li></ol>',
    '<ol start="2"><li><p>Bar</p><ul start="1"><li>Bar 1</li><li>Bar 2</li><li>Bar 3</li></ul></li></ol>',
  ])
})
