'use client'

import { Classified } from '~/ui/classified'
import { useCurrencyFormatter } from '~/ui/hooks/use-currency-formatter'

export function Money({ amount, short = false }: { amount: number; short?: boolean }) {
  let currencyFormatter = useCurrencyFormatter({ type: short ? 'short' : 'long' })

  return (
    <span className="font-sans tabular-nums">
      <Classified>{currencyFormatter.format(amount / 100)}</Classified>
    </span>
  )
}
