import { parseISO } from 'date-fns'
import { Base, DateBasedStrategy } from './date-based-strategy'

it('should calculate the next invoice number for the same date', () => {
  let strategy = new DateBasedStrategy()
  let now = parseISO('2023-02-01')

  expect(strategy.next(now)).toEqual('20230201001')
  expect(strategy.next(now)).toEqual('20230201002')
})

it.each(
  Object.entries(Base).map(([name, fn]) => {
    return [name, fn]
  }),
)(
  'should calculate the next invoice number for the same date with a custom base "%s"',
  (_, base) => {
    let strategy = new DateBasedStrategy(base)
    let now = parseISO('2023-02-01')

    expect(strategy.next(now)).toMatchSnapshot()
    expect(strategy.next(now)).toMatchSnapshot()
  },
)

it.each(
  Object.entries(Base).map(([name, fn]) => {
    return [name, fn]
  }),
)(
  'should calculate the next invoice number for the same date with a custom base "%s", and with a different amount of significantDigits',
  (_, base) => {
    let strategy = new DateBasedStrategy(base, 2)
    let now = parseISO('2023-02-01')

    expect(strategy.next(now)).toMatchSnapshot()
    expect(strategy.next(now)).toMatchSnapshot()
  },
)
