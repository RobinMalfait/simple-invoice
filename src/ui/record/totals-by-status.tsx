import { Fragment } from 'react'
import { Currency } from '~/domain/currency/currency'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { QuoteStatus } from '~/domain/quote/quote-status'
import {
  isAccepted,
  isDraft,
  isInvoice,
  isPaidRecord,
  isPartiallyPaid,
  isQuote,
  isSent,
} from '~/domain/record/filters'
import type { Record } from '~/domain/record/record'
import { StatusDisplay as InvoiceStatusDisplay } from '~/ui/invoice/status'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { StatusDisplay as QuoteStatusDisplay } from '~/ui/quote/status'
import { match } from '~/utils/match'
import { I18NPartialProvider } from '../hooks/use-i18n'

function groupByCurrency(records: Record[]) {
  return Array.from(
    records.reduce((acc, record) => {
      let key = record.client.currency
      if (!acc.has(key)) acc.set(key, [])
      acc.get(key)!.push(record)
      return acc
    }, new Map<Currency, Record[]>()),
  )
}

export function TotalsByStatus({ records }: { records: Record[] }) {
  let totals = (
    [
      // Quotes
      {
        type: 'quote',
        status: QuoteStatus.Draft,
        filter: (r) => {
          return isQuote(r) && isDraft(r)
        },
      },
      {
        type: 'quote',
        status: QuoteStatus.Sent,
        filter: (r) => {
          return isQuote(r) && isSent(r)
        },
      },
      {
        type: 'quote',
        status: QuoteStatus.Accepted,
        filter: (r) => {
          return isQuote(r) && isAccepted(r)
        },
      },

      // Invoices
      {
        type: 'invoice',
        status: InvoiceStatus.Draft,
        filter: (r) => {
          return isInvoice(r) && isDraft(r)
        },
      },
      {
        type: 'invoice',
        status: InvoiceStatus.Sent,
        filter: (r) => {
          return isInvoice(r) && isSent(r)
        },
      },
      {
        type: 'invoice',
        status: InvoiceStatus.PartiallyPaid,
        filter: (r) => {
          return isInvoice(r) && isPartiallyPaid(r)
        },
      },

      // Covers both invoices and receipts
      {
        type: 'invoice',
        status: InvoiceStatus.Paid,
        filter: (r) => {
          return isPaidRecord(r)
        },
      },
    ] satisfies {
      type: 'quote' | 'invoice'
      status: QuoteStatus | InvoiceStatus
      filter: (record: Record) => boolean
    }[]
  )
    .flatMap((t) => {
      return groupByCurrency(records).map(([currency, records]) => {
        return {
          currency,
          type: t.type,
          status: t.status,
          total: records.filter(t.filter).reduce((acc, record) => {
            return acc + total(record)
          }, 0),
        }
      })
    })
    .filter((t) => {
      return t.total > 0
    })

  return (
    <div className="flex items-center gap-2">
      {totals.map(({ type, currency, status, total }, idx, all) => {
        let Component = (() => {
          if (type === 'quote') return QuoteStatusDisplay
          if (type === 'invoice') return InvoiceStatusDisplay
          throw new Error(`Unknown type: ${type}`)
        })()

        let prev = all[idx - 1]
        let isDifferentType = prev && prev.type !== type

        return (
          <Fragment key={`${type}-${currency}-${status}`}>
            <I18NPartialProvider value={{ currency }}>
              {isDifferentType && <span className="text-black/10 dark:text-white/10">|</span>}
              {(idx === 0 || isDifferentType) && (
                <span className="text-sm">
                  {match(type, {
                    quote: 'Quotes:',
                    invoice: 'Invoices:',
                  })}
                </span>
              )}
              {/* @ts-expect-error TypeScript doesn't like this polymorphism shenanigans. */}
              <Component status={status}>
                <Money amount={total} />
              </Component>
            </I18NPartialProvider>
          </Fragment>
        )
      })}
    </div>
  )
}
