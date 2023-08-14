/**
 * @jest-environment jsdom
 */
import { dedent } from '~/utils/dedent'
import { split } from './html-split'

global.DOMParser = window.DOMParser
{
  let x = 0
  global.window.crypto.randomUUID = () => (x++).toString()
}
global.structuredClone = (x: any) => JSON.parse(JSON.stringify(x))

let html = String.raw
let md = String.raw

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
    '<ol start="4"><li><span>Other:</span></li></ol>',
    '<ol start="4"><li class="list-none"><ol start="1"><li>A</li></ol></li></ol>',
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
    </li></ol>`,
    '<ol start="4"><li class="list-none"><ol start="1"><li>A</li></ol></li></ol>',
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
      [4, 2],
    ),
  ).toEqual([
    '<ol start="1"><li>Foo</li><li>Bar</li><li>Baz</li><li><span>Qux:</span></li></ol>',
    '<ol start="4"><li class="list-none"><ol start="1"><li>A</li><li>B</li></ol></li></ol>',
  ])
})

it('should split tables', () => {
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
      [8, 4],
    ),
  ).toEqual([
    '<table><thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead><tbody><tr><td>A</td><td>B</td><td>C</td></tr><tr><td>D</td><td>E</td></tr></tbody></table>',
    '<table><tbody><tr><td>F</td></tr><tr><td>G</td><td>H</td><td>I</td></tr></tbody></table>',
  ])
})
