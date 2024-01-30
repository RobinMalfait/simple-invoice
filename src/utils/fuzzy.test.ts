import { expect, it } from 'vitest'
import { fuzzyMatch } from './fuzzy'

it('should match an exact match', () => {
  expect(fuzzyMatch('bar', 'bar')).toBe(true)
})

it('should match an "exact" match (case insensitive)', () => {
  expect(fuzzyMatch('BaR', 'bar')).toBe(true)
})

it('should match over multiple words', () => {
  expect(fuzzyMatch('tqbfjotld', 'The quick brown fox jumps over the lazy dog')).toBe(true)
})

it('should not match a different word', () => {
  expect(fuzzyMatch('foo', 'bar')).not.toBe(true)
})

it('should match partially', () => {
  expect(fuzzyMatch('b', 'bar')).toBe(true)
  expect(fuzzyMatch('a', 'bar')).toBe(true)
  expect(fuzzyMatch('r', 'bar')).toBe(true)
  expect(fuzzyMatch('ba', 'bar')).toBe(true)
  expect(fuzzyMatch('ar', 'bar')).toBe(true)
  expect(fuzzyMatch('br', 'bar')).toBe(true)
})
