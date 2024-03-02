import { expect, it } from 'vitest'
import { normalizeName } from './normalize-name'

it.each([
  // Basic
  ['example', 'Example'],
  ['EXAMPLE', 'Example'],
  ['ExAmPlE', 'Example'],

  // Uppercase first letter of each word
  ['hello world', 'Hello World'],
  ['hello beautiful world', 'Hello Beautiful World'],

  // Spaces
  ['  example', 'Example'],
  ['example  ', 'Example'],
  [' example ', 'Example'],
  ['   hello   world   ', 'Hello World'],

  // Try to keep abbreviates
  ['company sp', 'Company SP'],
  ['company llc', 'Company LLC'],

  // Replace special characters
  ['company, llc', 'Company LLC'],
  ['hello**world', 'Hello World'],
  ['hello__world', 'Hello World'],

  // Try to close non-closed parentheses
  ['company (llc', 'Company (LLC)'],
  ['(company llc', '(Company) LLC'],
  ['hello (beautiful world', 'Hello (Beautiful) World'],

  ['company llc)', 'Company (LLC)'],
  ['hello beautiful) world', 'Hello (Beautiful) World'],

  // Drop single characters in parentheses
  ['hello world (h)', 'Hello World'],
  ['hello world (h', 'Hello World'],
  ['hello world h)', 'Hello World'],
])('should convert "%s" to "%s"', (input, expected) => {
  expect(normalizeName(input)).toBe(expected)
})
