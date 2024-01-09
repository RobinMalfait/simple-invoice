import { useRecord } from '~/ui/hooks/use-record'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

export function Total(props: React.ComponentProps<'div'>) {
  let record = useRecord()

  return (
    <div {...props}>
      <Money
        amount={match(record.type, {
          quote: () => {
            return total(record)
          },
          invoice: () => {
            return total(record)
          },
          'credit-note': () => {
            return total(record)
          },
          receipt: () => {
            return 0
          },
        })}
      />
    </div>
  )
}
