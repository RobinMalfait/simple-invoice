import { endOfDay, isPast } from 'date-fns'
import { Invoice } from '~/domain/invoice/invoice'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { Quote } from '~/domain/quote/quote'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { Receipt } from '~/domain/receipt/receipt'
import type { Record } from '~/domain/record/record'
import { match } from '~/utils/match'

//

export function isQuote(record: Record): record is Quote {
  return record.type === 'quote'
}

export function isInvoice(record: Record): record is Invoice {
  return record.type === 'invoice'
}

export function isReceipt(record: Record): record is Receipt {
  return record.type === 'receipt'
}

// ---

export function isDraft(record: Quote | Invoice) {
  return match(
    record.type,
    {
      quote: (r: Quote) => r.status === QuoteStatus.Draft,
      invoice: (r: Invoice) => r.status === InvoiceStatus.Draft,
    },
    record,
  )
}

export function isSent(record: Quote | Invoice) {
  return match(
    record.type,
    {
      quote: (r: Quote) => r.status === QuoteStatus.Sent,
      invoice: (r: Invoice) => r.status === InvoiceStatus.Sent,
    },
    record,
  )
}

export function isAccepted(quote: Quote) {
  return quote.status === QuoteStatus.Accepted
}

export function isRejected(quote: Quote) {
  return quote.status === QuoteStatus.Rejected
}

export function isExpired(quote: Quote) {
  return quote.status === QuoteStatus.Expired
}

export function isClosed(record: Invoice | Quote) {
  return match(
    record.type,
    {
      quote: (r: Quote) => r.status === QuoteStatus.Closed,
      invoice: (r: Invoice) => r.status === InvoiceStatus.Closed,
    },
    record,
  )
}

export function isPaid(invoice: Invoice) {
  return invoice.status === InvoiceStatus.Paid
}

export function isPartiallyPaid(invoice: Invoice) {
  return invoice.status === InvoiceStatus.PartiallyPaid
}

export function isOverdue(invoice: Invoice) {
  return invoice.status === InvoiceStatus.Overdue
}

// ---

export function recordHasWarning(record: Record) {
  return match(
    record.type,
    {
      // When a quote is expired, it should be handled (probably closed)
      quote: (r: Quote) => r.status === QuoteStatus.Expired,

      invoice: (r: Invoice) => {
        // Overdue invoices should be handled, probably closed (+ new invoice)
        if (r.status === InvoiceStatus.Overdue) return true

        // Draft invoices with an issue date in the past are void because they cannot be completed
        // since they were never sent before.
        if (r.status === InvoiceStatus.Draft && isPast(r.issueDate)) return true

        return false
      },

      // Receipts are in the final state, nothing to warn about
      receipt: () => false,
    },
    record,
  )
}

export function recordHasAttachments(record: Record, type: 'any' | 'direct') {
  return match(type, {
    // Whether any of the records in the chain has attachments
    any: () =>
      match(
        record.type,
        {
          quote: (r: Quote) => r.attachments.length > 0,
          invoice: (r: Invoice) => {
            return r.attachments.length > 0 || (r.quote ? r.quote.attachments.length > 0 : false)
          },
          receipt: (r: Receipt) => r.attachments.length > 0 || r.invoice.attachments.length > 0,
        },
        record,
      ),

    // Whether the record itself has attachments
    direct: () =>
      match(
        record.type,
        {
          quote: (r: Quote) => r.attachments.length > 0,
          invoice: (r: Invoice) => r.attachments.length > 0,
          receipt: (r: Receipt) => r.attachments.length > 0,
        },
        record,
      ),
  })
}

export function warningMessageForRecord(record: Record): string | null {
  return match(
    record.type,
    {
      // When a quote is expired, it should be handled (probably closed)
      quote: (r: Quote) => {
        if (r.status === QuoteStatus.Expired) {
          return 'This quote is expired. You probably want to close it.'
        }

        return null
      },

      invoice: (r: Invoice) => {
        // Overdue invoices should be handled, probably closed (+ new invoice)
        if (r.status === InvoiceStatus.Overdue) {
          return 'This invoice is overdue. You probably want to close it and send a new invoice.'
        }

        // Draft invoices with an issue date in the past are void because they cannot be completed
        // since they were never sent before.
        if (r.status === InvoiceStatus.Draft) {
          if (isPast(endOfDay(r.issueDate))) {
            return 'This invoice is void because the issue date is in the past and this invoice has never been sent.'
          } else {
            return "Today is your lucky day, don't forget to send this invoice!"
          }
        }

        return null
      },

      // Receipts are in the final state, nothing to warn about
      receipt: () => null,
    },
    record,
  )
}

export function isPaidRecord(record: Record) {
  return match(
    record.type,
    {
      // A quote can never be paid
      quote: () => false,

      // An invoice is paid if it is in the paid state
      invoice: (r: Invoice) => r.status === InvoiceStatus.Paid,

      // A receipt can only be build from a paid invoice, therefore it is always paid
      receipt: () => true,
    },
    record,
  )
}

export function isActiveRecord(record: Record) {
  return match(
    record.type,
    {
      quote: (r: Quote) => {
        return [
          // Still in draft mode
          QuoteStatus.Draft,

          // Accepted could be considered "done", however, you probably want to convert this to an
          // invoice now.
          QuoteStatus.Accepted,

          // Sent to the client, waiting for a response
          QuoteStatus.Sent,
        ].includes(r.status)
      },
      invoice: (r: Invoice) => {
        return [
          // Still in draft mode
          InvoiceStatus.Draft,

          // Sent to the client, waiting for a response
          InvoiceStatus.Sent,

          // Partially paid, waiting for the remaining amount
          InvoiceStatus.PartiallyPaid,
        ].includes(r.status)
      },

      // All receipts are considered "done"
      receipt: () => false,
    },
    record,
  )
}

export function isDeadRecord(record: Record) {
  return match(
    record.type,
    {
      // A quote is dead when it is rejected or expired
      quote: (r: Quote) => [QuoteStatus.Rejected, QuoteStatus.Expired].includes(r.status),

      // An invoice is dead when it is overdue
      invoice: (r: Invoice) => [InvoiceStatus.Overdue].includes(r.status),

      // A receipt is never dead
      receipt: () => false,
    },
    record,
  )
}
