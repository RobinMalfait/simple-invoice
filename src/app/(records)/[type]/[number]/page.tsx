import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { transactions as allTransactions, me, records } from '~/data'
import { CreditNote as CreditNoteType } from '~/domain/credit-note/credit-note'
import { Invoice as InvoiceType } from '~/domain/invoice/invoice'
import { Quote as QuoteType } from '~/domain/quote/quote'
import { Receipt as ReceiptType } from '~/domain/receipt/receipt'
import { recordHasWarning, warningMessageForRecord } from '~/domain/record/filters'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { ActivityFeed } from '~/ui/invoice/activity-feed'
import { AttachmentList } from '~/ui/invoice/attachment-list'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'
import { Notes } from '~/ui/invoice/notes'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { TransactionsTable } from '~/ui/transaction/table'
import { match } from '~/utils/match'
import { loadTemplateList } from './actions'
import { Actions } from './components'
import { History, HistoryActions } from './history'

export default async function Invoice({
  params,
}: {
  params: Promise<{ type: string; number: string }>
}) {
  let { type, number } = await params
  let record = records.find((record) => {
    return record.type === type && record.number === number
  })
  if (!record) {
    redirect('/')
  }

  let templates = await loadTemplateList(record)
  let transactions = allTransactions.filter((t) => {
    return t.record?.id === record?.id
  })

  return (
    <div className="flex h-full flex-1 overflow-hidden [--spacing:theme(spacing.8)]">
      <History record={record} records={records}>
        <div className="flex w-[calc(210mm+theme(spacing.10)*2)] flex-1 snap-y snap-mandatory scroll-px-10 scroll-pt-10 overflow-auto scroll-smooth bg-gray-950/10 shadow-inner dark:bg-zinc-600">
          <div className="mx-auto mb-10">
            <div className="p-10">
              <InvoicePreview />
              <div className="relative mx-auto flex h-[calc(100vh-297mm-(theme(spacing.10)*2)-theme(spacing.4))]"></div>
            </div>
          </div>
        </div>

        <I18NProvider
          value={{
            // Prefer my language/currency when looking at the overview of records.
            language: me.language,
            currency: me.currency,
          }}
        >
          <div className="hidden max-w-lg shrink-0 basis-[32rem] flex-col gap-[--spacing] overflow-auto px-4 py-10 sm:px-6 lg:flex lg:px-8">
            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
              <h3 className="flex items-center justify-between text-xl">
                <Link href={`/clients/${record.client.id}`} className="group relative">
                  {record.client.nickname}
                  <div className="absolute inset-x-0 bottom-0">
                    <div className="h-px w-full border-b border-dashed border-gray-300 group-hover:border-solid dark:border-white/40"></div>
                  </div>
                </Link>
                <span>
                  #
                  {match(
                    record.type,
                    {
                      quote(r: QuoteType) {
                        return r.number
                      },
                      invoice(r: InvoiceType) {
                        return r.number
                      },
                      'credit-note'(r: CreditNoteType) {
                        return r.invoice.number
                      },
                      receipt(r: ReceiptType) {
                        return r.invoice.number
                      },
                    },
                    record,
                  )}
                </span>
              </h3>
              <div className="rounded-md border border-gray-200 bg-gray-100 p-4 dark:border-zinc-950 dark:bg-zinc-950">
                <div className="p-4 py-8 text-center text-2xl font-bold text-gray-950 dark:text-gray-300">
                  <Money amount={total(record)} />
                </div>
              </div>
              <div className="flex items-center justify-between text-center">
                <Actions />
              </div>
            </div>

            <div className="-my-4 flex items-center justify-end empty:hidden">
              <HistoryActions />
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Activity</span>
              <ActivityFeed records={records} />
            </div>

            {record.internal.notes.length > 0 && (
              <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <LockClosedIcon
                    className="h-4 w-4 text-gray-600 dark:text-gray-300"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    Internal notes
                  </span>
                </div>
                <Notes records={records} />
              </div>
            )}

            {record.attachments.length > 0 && (
              <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  Attachments
                </span>
                <AttachmentList />
              </div>
            )}

            {transactions.length > 0 && (
              <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  Transactions
                </span>
                <TransactionsTable viewContext="supplier" transactions={transactions} />
              </div>
            )}

            {templates.length > 0 && (
              <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  Templates
                </span>
                <ul role="list" className="space-y-1">
                  {templates.map((template) => {
                    return (
                      <li key={template.id} className="relative flex gap-x-4">
                        <Link
                          href={`/${record!.type}/${record!.number}/mail-templates/${template.id}`}
                          className="absolute inset-0 h-full w-full"
                        />

                        <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white dark:bg-zinc-900">
                          <EyeIcon
                            className="h-4 w-4 text-gray-600 dark:text-gray-300"
                            aria-hidden="true"
                          />
                        </div>

                        <p className="flex-auto py-0.5 text-xs leading-5 text-gray-600 dark:text-gray-300">
                          {template.name}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {recordHasWarning(record) && (
              <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4 dark:border-yellow-400/30 dark:bg-yellow-400/10">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon
                      className="h-5 w-5 text-yellow-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-500">
                      {warningMessageForRecord(record)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </I18NProvider>
      </History>
    </div>
  )
}
