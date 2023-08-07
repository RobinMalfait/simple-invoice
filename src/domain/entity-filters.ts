import { isPast } from 'date-fns'
import { Invoice } from '~/domain/invoice/invoice'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { Quote } from '~/domain/quote/quote'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { Receipt } from '~/domain/receipt/receipt'
import { match } from '~/utils/match'

type Entity = Quote | Invoice | Receipt

export function isLayeredEntity(entity: Entity) {
  return match(
    entity.type,
    {
      // Lowest layer, no layer below
      quote: () => false,

      // An invoice is layered if it has a quote
      invoice: (e: Invoice) => e.quote !== null,

      // All receipts start from an invoice, therefore always layered
      receipt: () => true,
    },
    entity,
  )
}

export function entityHasWarning(entity: Entity) {
  return match(
    entity.type,
    {
      // When a quote is expired, it should be handled (probably closed)
      quote: (e: Quote) => e.status === QuoteStatus.Expired,

      invoice: (e: Invoice) => {
        // Overdue invoices should be handled, probably closed (+ new invoice)
        if (e.status === InvoiceStatus.Overdue) return true

        // Draft invoices with an issue date in the past are void because they cannot be completed
        // since they were never sent before.
        if (e.status === InvoiceStatus.Draft && isPast(e.issueDate)) return true

        return false
      },

      // Receipts are in the final state, nothing to warn about
      receipt: () => false,
    },
    entity,
  )
}

export function isPaidEntity(entity: Entity) {
  return match(
    entity.type,
    {
      // A quote can never be paid
      quote: () => false,

      // An invoice is paid if it is in the paid state
      invoice: (e: Invoice) => e.status === InvoiceStatus.Paid,

      // A receipt can only be build from a paid invoice, therefore it is always paid
      receipt: () => true,
    },
    entity,
  )
}

export function isActiveEntity(entity: Entity) {
  return match(
    entity.type,
    {
      quote: (e: Quote) => {
        return [
          // Still in draft mode
          QuoteStatus.Draft,

          // Accepted could be considered "done", however, you probably want to convert this to an
          // invoice now.
          QuoteStatus.Accepted,

          // Sent to the client, waiting for a response
          QuoteStatus.Sent,
        ].includes(e.status)
      },
      invoice: (e: Invoice) => {
        return [
          // Still in draft mode
          InvoiceStatus.Draft,

          // Sent to the client, waiting for a response
          InvoiceStatus.Sent,

          // Partially paid, waiting for the remaining amount
          InvoiceStatus.PartialPaid,
        ].includes(e.status)
      },

      // All receipts are considered "done"
      receipt: () => false,
    },
    entity,
  )
}

export function isDeadEntity(entity: Entity) {
  return match(
    entity.type,
    {
      // A quote is dead when it is rejected or expired
      quote: (e: Quote) => [QuoteStatus.Rejected, QuoteStatus.Expired].includes(e.status),

      // An invoice is dead when it is overdue
      invoice: (e: Invoice) => [InvoiceStatus.Overdue].includes(e.status),

      // A receipt is never dead
      receipt: () => false,
    },
    entity,
  )
}
