'use client'

import { useCurrencyFormatter } from '~/ui/hooks/use-currency-formatter'

export function Money({ amount }: { amount: number }) {
  let currencyFormatter = useCurrencyFormatter()

  return <span className="font-sans tabular-nums">{currencyFormatter.format(amount / 100)}</span>
}
