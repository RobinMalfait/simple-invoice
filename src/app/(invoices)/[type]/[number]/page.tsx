import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { redirect } from 'next/navigation'
import { invoices, me } from '~/data'
import { entityHasWarning, warningMessageForEntity } from '~/domain/entity-filters'
import { Invoice as InvoiceType } from '~/domain/invoice/invoice'
import { Quote as QuoteType } from '~/domain/quote/quote'
import { Receipt as ReceiptType } from '~/domain/receipt/receipt'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { ActivityFeed } from '~/ui/invoice/activity-feed'
import { AttachmentList } from '~/ui/invoice/attachment-list'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'
import { Actions } from './actions'
import { History, HistoryDropdown } from './history'

export default function Invoice({
  params: { type, number },
}: {
  params: { type: string; number: string }
}) {
  let entity = invoices.find((invoice) => invoice.type === type && invoice.number === number)

  if (!entity) {
    redirect('/')
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden [--spacing:theme(spacing.8)]">
      <History entity={entity}>
        <div className="flex overflow-auto bg-gray-950/10 dark:bg-zinc-600">
          <div className="mb-8">
            <div className="px-4 py-8 sm:px-6 lg:px-8">
              <InvoicePreview />
            </div>
          </div>
        </div>

        <I18NProvider
          value={{
            // Prefer my language/currency when looking at the overview of invoices.
            language: me.language,
            currency: me.currency,
          }}
        >
          <div className="flex max-w-lg flex-1 shrink-0 flex-col gap-[--spacing] overflow-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
              <h3 className="flex items-center justify-between text-xl">
                <span>{entity.client.name}</span>
                <span>
                  #
                  {match(
                    entity.type,
                    {
                      quote: (e: QuoteType) => e.number,
                      invoice: (e: InvoiceType) => e.number,
                      receipt: (e: ReceiptType) => e.invoice.number,
                    },
                    entity,
                  )}
                </span>
              </h3>
              <div className="rounded-md border border-gray-200 bg-gray-100 p-4 dark:border-zinc-950 dark:bg-zinc-950">
                <div className="p-4 py-8 text-center text-2xl font-bold text-gray-950 dark:text-gray-300">
                  <Money amount={total(entity)} />
                </div>
              </div>
              <div className="flex items-center justify-between text-center">
                <Actions />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Activity</span>
              <ActivityFeed latestVersionEntity={entity} />
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-gray-300">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                Attachments
              </span>
              <AttachmentList />
            </div>

            <div className="flex items-center justify-end empty:hidden">
              <HistoryDropdown />
            </div>

            {entityHasWarning(entity) && (
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
                      {warningMessageForEntity(entity)}
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
