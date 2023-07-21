import { CheckCircleIcon, EyeIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { redirect } from 'next/navigation'
import { invoices } from '~/data'
import { Invoice } from '~/domain/invoice/invoice'
import { classNames } from '~/ui/class-names'
import { DownloadLink } from '~/ui/download-link'
import { InvoiceProvider } from '~/ui/hooks/use-invoice'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'
import { TotalFeatures, total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

export default function Invoice({ params: { number } }: { params: { number: string } }) {
  let invoice = invoices.find((invoice) => invoice.number === number)

  if (!invoice) {
    redirect('/')
  }

  return (
    <InvoiceProvider invoice={invoice}>
      <div className="[--spacing:theme(spacing.8)]">
        <div className="mx-auto flex w-full max-w-7xl flex-1 gap-[--spacing] px-4 py-[--spacing] sm:px-6 lg:px-8">
          <div className="flex flex-[calc(210mm+calc(var(--spacing)*2))] grow-0 flex-col rounded-lg border border-black/10 bg-gray-950/10">
            <div className="h-[calc(297mm+calc(var(--spacing)*2))] overflow-hidden">
              <div className="relative z-10 h-full flex-1 overflow-auto py-[--spacing]">
                <InvoicePreview invoice={invoice} />
              </div>
            </div>
          </div>
          <div className="sticky top-24 flex flex-1 flex-col gap-[--spacing]">
            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
              <h3 className="flex items-center justify-between text-xl">
                <span>{invoice.client.name}</span>
                <span>#{invoice.number}</span>
              </h3>
              <div className="rounded-md border border-gray-200 bg-gray-100 p-4">
                <div className="p-4 text-center text-2xl font-bold text-gray-950">
                  <Money amount={total(invoice.items, TotalFeatures.IncludingVAT)} />
                </div>
              </div>
              <div className="flex items-center justify-between text-center">
                <DownloadLink
                  className="inline-flex items-center justify-center"
                  href={`/invoices/${invoice.number}/pdf`}
                >
                  Download PDF
                </DownloadLink>
                <a
                  className="inline-flex items-center justify-center"
                  target="_blank"
                  href={`/invoices/${invoice.number}/pdf?preview`}
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  <span>Preview PDF</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
              <span className="text-sm font-medium text-gray-900">Activity</span>
              <ActivityFeed activity={invoice.events} />
            </div>
          </div>
        </div>
      </div>
    </InvoiceProvider>
  )
}

function ActivityFeed({ activity }: { activity: Invoice['events'] }) {
  return (
    <>
      <ul role="list" className="space-y-6">
        {activity.map((activityItem, activityItemIdx) => (
          <li key={activityItem.id} className="relative flex gap-x-4">
            <div
              className={classNames(
                activityItemIdx === activity.length - 1 ? 'h-6' : '-bottom-6',
                'absolute left-0 top-0 flex w-6 justify-center',
              )}
            >
              <div className="w-px bg-gray-200" />
            </div>

            <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
              {activityItemIdx === activity.length - 1 ? (
                match(activityItem.type, {
                  drafted: () => (
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
                  ),
                  sent: () => (
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
                  ),
                  'partially-paid': () => (
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
                  ),
                  paid: () => (
                    <CheckCircleIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  ),
                  overdue: () => (
                    <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  ),
                })
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
              )}
            </div>

            <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
              {match(
                activityItem.type,
                {
                  drafted: () => (
                    <>
                      <span className="font-medium text-gray-900">Drafted</span> the invoice.
                    </>
                  ),
                  sent: () => (
                    <>
                      <span className="font-medium text-gray-900">Sent</span> the invoice.
                    </>
                  ),
                  'partially-paid': (
                    activityItem: Extract<Invoice['events'][number], { type: 'partially-paid' }>,
                  ) => (
                    <>
                      <span className="font-medium text-gray-900">Partially paid</span> with{' '}
                      <Money amount={activityItem.amount} />, outstanding amount of{' '}
                      <Money amount={activityItem.outstanding} /> left.
                    </>
                  ),
                  paid: () => (
                    <>
                      <span className="font-medium text-gray-900">Paid</span> the invoice.
                    </>
                  ),
                  overdue: () => (
                    <>
                      The invoice is <span className="font-medium text-gray-900">overdue</span>.
                    </>
                  ),
                },
                activityItem,
              )}
            </p>

            {activityItem.at && (
              <time
                dateTime={activityItem.at.toISOString()}
                className="flex-none py-0.5 text-xs leading-5 text-gray-500"
              >
                {formatDistanceToNow(activityItem.at, { addSuffix: true })}
              </time>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
