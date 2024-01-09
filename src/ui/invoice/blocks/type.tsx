import { useRecord } from '~/ui/hooks/use-record'
import { Translation } from '~/ui/hooks/use-translation'
import { match } from '~/utils/match'

export function Type(props: React.ComponentProps<'span'>) {
  let record = useRecord()

  return (
    <Translation
      {...props}
      for={match(record.type, {
        quote: 'quote.title',
        invoice: 'invoice.title',
        'credit-note': 'credit-note.title',
        receipt: 'receipt.title',
      })}
    />
  )
}
