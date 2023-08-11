import { IncrementStrategy } from './increment-strategy'

it('should calculate the next invoice number', () => {
  let strategy = new IncrementStrategy()

  expect(strategy.next()).toEqual('0001')
  expect(strategy.next()).toEqual('0002')
})

it('should calculate the next invoice number with a custom amount of significantDigits', () => {
  let strategy = new IncrementStrategy(3)

  expect(strategy.next()).toEqual('001')
  expect(strategy.next()).toEqual('002')
})
