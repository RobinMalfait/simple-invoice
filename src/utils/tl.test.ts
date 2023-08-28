import { parseISO } from 'date-fns'
import { render } from './tl'

it('should keep normal text as-is', () => {
  expect(render('Hello world', {})).toBe('Hello world')
})

it('should replace a variable', () => {
  expect(render('Hello {{name}}!', { name: 'world' })).toBe('Hello world!')
})

it('should replace a nested variable', () => {
  expect(render('Hello {{user.name}}!', { user: { name: 'world' } })).toBe('Hello world!')
})

describe('arguments', () => {
  describe('dates', () => {
    it('should be possible to pass a format to a date', () => {
      expect(render('Happy {{bigbang:yyyy}}!', { bigbang: parseISO('2023-01-02') })).toBe(
        'Happy 2023!',
      )
    })
  })
})

describe('transformers', () => {
  it('should transform the field using a transformation', () => {
    expect(render('Hello {{user.name|upper}}!', { user: { name: 'world' } })).toBe('Hello WORLD!')
    expect(render('Hello {{user.name|lower}}!', { user: { name: 'WORLD' } })).toBe('Hello world!')
    expect(render('Hello {{user.name|kebab}}!', { user: { name: 'big universe' } })).toBe(
      'Hello big-universe!',
    )
  })

  it('should transform the field using multiple transformations', () => {
    expect(render('Hello {{user.name|kebab|upper}}!', { user: { name: 'big universe' } })).toBe(
      'Hello BIG-UNIVERSE!',
    )
  })
})
