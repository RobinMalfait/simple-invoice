'use client'

import { Classified, useIsClassified } from '~/ui/classified'
import { useCurrencyFormatter } from '~/ui/hooks/use-currency-formatter'
import { classNames } from './class-names'

export function Money({
  amount,
  short = false,
  className,
  ...props
}: { amount: number; short?: boolean } & React.ComponentProps<'span'>) {
  let currencyFormatter = useCurrencyFormatter({ type: short ? 'short' : 'long' })
  let isClassified = useIsClassified()

  return (
    <span className={classNames('font-sans tabular-nums', className)} {...props}>
      <Classified>{currencyFormatter.format(isClassified ? 10000 : amount / 100)}</Classified>
    </span>
  )
}
