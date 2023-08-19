'use client'

import { CalendarIcon, PaperClipIcon, RectangleStackIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { entityHasAttachments, entityHasWarning, isQuote } from '~/domain/entity-filters'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { Receipt } from '~/domain/receipt/receipt'
import { classNames } from '~/ui/class-names'
import { useInvoiceStacks } from '~/ui/hooks/use-invoice-stacks'
import { useTranslation } from '~/ui/hooks/use-translation'
import { StatusDisplay as InvoiceStatusDisplay } from '~/ui/invoice/status'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { StatusDisplay as QuoteStatusDisplay } from '~/ui/quote/status'
import { match } from '~/utils/match'

type Entity = Quote | Invoice | Receipt

export function TinyInvoice({ invoice }: { invoice: Entity }) {
  let t = useTranslation()
  let stacks = useInvoiceStacks()
  let isLayered = (stacks.get(invoice.id)?.length ?? 0) > 1
  let hasAttachments = entityHasAttachments(invoice, 'any')
  let warning = entityHasWarning(invoice)

  return (
    <div
      className={classNames(
        'group relative rounded-md bg-white shadow transition-[transform,opacity] duration-300 will-change-transform hover:-translate-y-1 dark:bg-zinc-950',
        isQuote(invoice) &&
          invoice.status === QuoteStatus.Rejected &&
          'opacity-70 hover:opacity-100',
      )}
    >
      {isLayered && (
        <>
          <div className="absolute inset-0 -z-10 h-full w-full rotate-2 rounded-md bg-gray-100 ring-1 ring-black/5 drop-shadow transition-[transform,opacity] duration-200 will-change-[transform,opacity] group-hover:rotate-0 group-hover:opacity-0 dark:bg-zinc-700"></div>
          <div className="absolute inset-0 -z-10 h-full w-full -rotate-1 rounded-md bg-gray-50 ring-1 ring-black/5 drop-shadow transition-transform duration-200 will-change-[transform,opacity] group-hover:rotate-0 group-hover:opacity-0 dark:bg-zinc-600"></div>
        </>
      )}

      {warning && (
        <div className="absolute right-0 top-0 z-50 bg-red-500">
          <div className="absolute -right-1.5 -top-1.5">
            <span className="flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex aspect-a4 w-full shrink-0 flex-col rounded-md bg-gradient-to-br from-rose-50/90 to-blue-50/90 ring-1 ring-black/5 dark:from-rose-200/90 dark:to-blue-200/90">
        <div className="flex items-center justify-between rounded-t-md bg-gray-50 p-3 text-gray-500 dark:bg-zinc-950/75 dark:text-gray-300">
          <span className="relative z-50 truncate" title={invoice.client.name}>
            {invoice.client.name}
          </span>
          {match(
            invoice.type,
            {
              quote: (e: Quote) => <QuoteStatusDisplay status={e.status} />,
              invoice: (e: Invoice) => <InvoiceStatusDisplay status={e.status} />,
              receipt: (e: Receipt) => <InvoiceStatusDisplay status={e.invoice.status} />,
            },
            invoice,
          )}
        </div>

        <div className="relative flex flex-1 items-center justify-center border-y border-black/5">
          <div className="absolute bottom-2 right-2 flex gap-2 empty:hidden">
            {hasAttachments && (
              <div title="Contains attachments" className="rounded-md bg-black/5 p-2">
                <PaperClipIcon className="h-5 w-5" />
              </div>
            )}
            {isLayered && (
              <div title="Contains related documents" className="rounded-md bg-black/5 p-2">
                <RectangleStackIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="text-center">
            {match(invoice.type, {
              quote: () => <small className="lowercase">{t((x) => x.quote.title)}</small>,
              invoice: null,
              receipt: () => <small className="lowercase">{t((x) => x.receipt.title)}</small>,
            })}
            <h3 className="text-xl font-medium text-gray-900">{invoice.number}</h3>
            <div className="mt-1 flex flex-grow flex-col justify-between">
              <div className="text-sm text-gray-500">
                <Money amount={total(invoice)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-b-md bg-gray-50 p-3 dark:bg-zinc-950/75">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
            <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-white" />
            <span>
              {match(
                invoice.type,
                {
                  quote: (e: Quote) => format(e.quoteDate, 'PP'),
                  invoice: (e: Invoice) => format(e.issueDate, 'PP'),
                  receipt: (e: Receipt) => format(e.receiptDate, 'PP'),
                },
                invoice,
              )}
            </span>
          </span>
          <span className="flex gap-1">
            <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
            <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-white" />
            <span>
              {match(
                invoice.type,
                {
                  quote: (e: Quote) => format(e.quoteExpirationDate, 'PP'),
                  invoice: (e: Invoice) => format(e.dueDate, 'PP'),
                  receipt: (e: Receipt) => format(e.receiptDate, 'PP'),
                },
                invoice,
              )}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
