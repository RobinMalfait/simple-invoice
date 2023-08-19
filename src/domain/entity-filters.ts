import { isPast } from 'date-fns'
import { Invoice } from '~/domain/invoice/invoice'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { Quote } from '~/domain/quote/quote'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { Receipt } from '~/domain/receipt/receipt'
import { match } from '~/utils/match'

type Entity = Quote | Invoice | Receipt

export function isQuote(entity: Entity): entity is Quote {
  return entity.type === 'quote'
}

export function isInvoice(entity: Entity): entity is Invoice {
  return entity.type === 'invoice'
}

export function isReceipt(entity: Entity): entity is Receipt {
  return entity.type === 'receipt'
}

export function isAccepted(quote: Quote) {
  return quote.status === QuoteStatus.Accepted
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

export function entityHasAttachments(entity: Entity, type: 'any' | 'direct') {
  return match(type, {
    // Whether any of the entities in the chain has attachments
    any: () =>
      match(
        entity.type,
        {
          quote: (e: Quote) => e.attachments.length > 0,
          invoice: (e: Invoice) => {
            return e.attachments.length > 0 || (e.quote ? e.quote.attachments.length > 0 : false)
          },
          receipt: (e: Receipt) => e.attachments.length > 0 || e.invoice.attachments.length > 0,
        },
        entity,
      ),

    // Whether the entity itself has attachments
    direct: () =>
      match(
        entity.type,
        {
          quote: (e: Quote) => e.attachments.length > 0,
          invoice: (e: Invoice) => e.attachments.length > 0,
          receipt: (e: Receipt) => e.attachments.length > 0,
        },
        entity,
      ),
  })
}

export function warningMessageForEntity(entity: Entity): string | null {
  return match(
    entity.type,
    {
      // When a quote is expired, it should be handled (probably closed)
      quote: (e: Quote) => {
        if (e.status === QuoteStatus.Expired) {
          return 'This quote is expired. You probably want to close it.'
        }

        return null
      },

      invoice: (e: Invoice) => {
        // Overdue invoices should be handled, probably closed (+ new invoice)
        if (e.status === InvoiceStatus.Overdue) {
          return 'This invoice is overdue. You probably want to close it and send a new invoice.'
        }

        // Draft invoices with an issue date in the past are void because they cannot be completed
        // since they were never sent before.
        if (e.status === InvoiceStatus.Draft && isPast(e.issueDate)) {
          return 'This invoice is void because the issue date is in the past and this invoice has never been sent.'
        }

        return null
      },

      // Receipts are in the final state, nothing to warn about
      receipt: () => null,
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
          InvoiceStatus.PartiallyPaid,
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
