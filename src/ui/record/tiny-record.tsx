'use client'

import { CalendarIcon, PaperClipIcon, RectangleStackIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { CreditNote } from '~/domain/credit-note/credit-note'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { recordHasAttachments, recordHasWarning } from '~/domain/record/filters'
import type { Record } from '~/domain/record/record'
import { useRecordStacks } from '~/ui/hooks/use-record-stacks'
import { StatusDisplay as InvoiceStatusDisplay } from '~/ui/invoice/status'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { StatusDisplay as QuoteStatusDisplay } from '~/ui/quote/status'
import { match } from '~/utils/match'

export function TinyRecord({ record }: { record: Record }) {
  let stacks = useRecordStacks()
  let isLayered = (stacks[record.id]?.length ?? 0) > 1
  let hasAttachments = recordHasAttachments(record, 'any')
  let warning = recordHasWarning(record)

  return (
    <div className="group/tiny-record relative rounded-md bg-white text-gray-700 shadow transition-[transform,opacity] duration-300 will-change-transform hover:-translate-y-1 dark:bg-zinc-950">
      {isLayered && (
        <>
          <div className="absolute inset-0 -z-10 h-full w-full rotate-2 rounded-md bg-gray-100 ring-1 ring-black/5 drop-shadow transition-[transform,opacity] duration-200 will-change-[transform,opacity] group-hover/tiny-record:rotate-0 group-hover/tiny-record:opacity-0 dark:bg-zinc-700"></div>
          <div className="absolute inset-0 -z-10 h-full w-full -rotate-1 rounded-md bg-gray-50 ring-1 ring-black/5 drop-shadow transition-transform duration-200 will-change-[transform,opacity] group-hover/tiny-record:rotate-0 group-hover/tiny-record:opacity-0 dark:bg-zinc-600"></div>
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
          <span className="relative z-50 truncate" title={record.client.nickname}>
            {record.client.nickname}
          </span>
          {match(
            record.type,
            {
              quote: (r: Quote) => {
                return <QuoteStatusDisplay status={r.status} />
              },
              invoice: (r: Invoice) => {
                return <InvoiceStatusDisplay status={r.status} />
              },
              'credit-note': () => {
                return null
              },
              receipt: (r: Receipt) => {
                return <InvoiceStatusDisplay status={r.invoice.status} />
              },
            },
            record,
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
            {match(record.type, {
              quote: () => {
                return <small className="lowercase">quote</small>
              },
              invoice: null,
              'credit-note': () => {
                return <small className="lowercase">credit note</small>
              },
              receipt: () => {
                return <small className="lowercase">receipt</small>
              },
            })}
            <h3 className="text-xl font-medium text-gray-900">{record.number}</h3>
            <div className="mt-1 flex flex-grow flex-col justify-between">
              <div className="text-sm text-gray-500">
                <Money amount={total(record)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-b-md bg-gray-50 p-3 dark:bg-zinc-950/75">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
            <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-white" />
            <span>
              {match(
                record.type,
                {
                  quote: (r: Quote) => {
                    return format(r.quoteDate, 'PP')
                  },
                  invoice: (r: Invoice) => {
                    return format(r.issueDate, 'PP')
                  },
                  'credit-note': (r: CreditNote) => {
                    return format(r.creditNoteDate, 'PP')
                  },
                  receipt: (r: Receipt) => {
                    return format(r.receiptDate, 'PP')
                  },
                },
                record,
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
                record.type,
                {
                  quote: (r: Quote) => {
                    return format(r.quoteExpirationDate, 'PP')
                  },
                  invoice: (r: Invoice) => {
                    return format(r.dueDate, 'PP')
                  },
                  'credit-note': (r: CreditNote) => {
                    return format(r.creditNoteDate, 'PP')
                  },
                  receipt: (r: Receipt) => {
                    return format(r.receiptDate, 'PP')
                  },
                },
                record,
              )}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
