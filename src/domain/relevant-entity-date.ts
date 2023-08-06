import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { match } from '~/utils/match'

type Entity = Quote | Invoice | Receipt

export function resolveRelevantEntityDate(entity: Entity) {
  return match(
    entity.type,
    {
      quote: (e: Quote) => e.quoteDate,
      invoice: (e: Invoice) => e.issueDate,
      receipt: (e: Receipt) => e.receiptDate,
    },
    entity,
  )
}
