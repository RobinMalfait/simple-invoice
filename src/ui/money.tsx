'use client'

import { Classified, useIsClassified } from '~/ui/classified'
import { useCurrencyFormatter } from '~/ui/hooks/use-currency-formatter'

export function Money({ amount, short = false }: { amount: number; short?: boolean }) {
  let currencyFormatter = useCurrencyFormatter({ type: short ? 'short' : 'long' })
  let isClassified = useIsClassified()

  return (
    <span className="font-sans tabular-nums">
      <Classified>{currencyFormatter.format(isClassified ? 10000 : amount / 100)}</Classified>
    </span>
  )
}
