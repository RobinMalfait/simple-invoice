import { dot } from '~/utils/dot'

it('should resolve given a path', () => {
  expect(dot({ foo: { bar: { baz: 'abc' } } }, 'foo.bar.baz')).toBe('abc')
})

it('should throw when a path is used that does not exist', () => {
  expect(() => {
    // @ts-expect-error We are doing this on purpose
    return dot({ foo: { bar: { baz: 'abc' } } }, 'foo.foo.foo')
  }).toThrowError(new Error('Could not find property `foo` in `bar`'))
})
