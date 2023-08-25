'use client'

import { useCurrencyFormatter } from '~/ui/hooks/use-currency-formatter'

export function Money({ amount, short = false }: { amount: number; short?: boolean }) {
  let currencyFormatter = useCurrencyFormatter({ type: short ? 'short' : 'long' })

  return <span className="font-sans tabular-nums">{currencyFormatter.format(amount / 100)}</span>
}
