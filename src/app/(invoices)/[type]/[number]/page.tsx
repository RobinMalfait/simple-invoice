import {
  CheckCircleIcon,
  ClockIcon,
  EllipsisHorizontalCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { redirect } from 'next/navigation'
import { invoices } from '~/data'
import { Invoice as InvoiceType } from '~/domain/invoice/invoice'
import { Quote as QuoteType } from '~/domain/quote/quote'
import { Receipt as ReceiptType } from '~/domain/receipt/receipt'
import { classNames } from '~/ui/class-names'
import { DownloadLink } from '~/ui/download-link'
import { InvoiceProvider } from '~/ui/hooks/use-invoice'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { assertNever } from '~/utils/assert-never'
import { match } from '~/utils/match'

type Entity = QuoteType | InvoiceType | ReceiptType

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
    <InvoiceProvider invoice={entity}>
      <div className="[--spacing:theme(spacing.8)]">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-wrap gap-[--spacing] px-4 py-[--spacing] sm:px-6 lg:px-8">
          <div className="flex w-[calc(210mm+calc(var(--spacing)*2))] grow-0 flex-col rounded-lg border border-black/10 bg-gray-950/10 dark:bg-zinc-600">
            <div className="h-[calc(297mm+calc(var(--spacing)*2))] overflow-hidden">
              <div className="relative z-10 h-full flex-1 overflow-auto py-[--spacing]">
                <InvoicePreview invoice={entity} />
              </div>
            </div>
          </div>

          <div className="sticky top-24 flex max-w-md flex-1 flex-col gap-[--spacing]">
            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-800 dark:text-gray-300">
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
              <div className="rounded-md border border-gray-200 bg-gray-100 p-4 dark:border-zinc-950 dark:bg-zinc-900">
                <div className="p-4 py-8 text-center text-2xl font-bold text-gray-950 dark:text-gray-300">
                  <Money amount={total(entity)} />
                </div>
              </div>
              <div className="flex items-center justify-between text-center">
                <DownloadLink
                  className="inline-flex items-center justify-center"
                  href={`/${entity.type}/${entity.number}/pdf`}
                >
                  Download PDF
                </DownloadLink>
                <a
                  className="inline-flex items-center justify-center"
                  target="_blank"
                  href={`/${entity.type}/${entity.number}/pdf?preview`}
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  <span>Preview PDF</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-800 dark:text-gray-300">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Activity</span>
              <ActivityFeed activity={entity.events} />
            </div>
          </div>
        </div>
      </div>
    </InvoiceProvider>
  )
}

function ActivityFeed({ activity }: { activity: Entity['events'] }) {
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
              <div className="w-px bg-gray-200 dark:bg-zinc-600" />
            </div>

            <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white dark:bg-zinc-800">
              {activityItemIdx === activity.length - 1 ? (
                <ActivityIndicator item={activityItem} />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300 dark:bg-zinc-800 dark:ring-gray-500" />
              )}
            </div>

            <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500 dark:text-gray-300">
              <ActivityText item={activityItem} />
            </p>

            {activityItem.at && (
              <time
                title={activityItem.at.toLocaleString()}
                dateTime={activityItem.at.toISOString()}
                className="flex-none py-0.5 text-xs leading-5 text-gray-500 dark:text-gray-300"
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

function ActivityIndicator({ item }: { item: Entity['events'][number] }) {
  switch (item.type) {
    case 'quote-drafted':
    case 'invoice-drafted':
      return (
        <PencilSquareIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )

    case 'quote-sent':
    case 'invoice-sent':
      return (
        <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-300" aria-hidden="true" />
      )

    case 'invoice-partially-paid':
      return (
        <EllipsisHorizontalCircleIcon
          className="h-6 w-6 text-orange-600 dark:text-orange-300"
          aria-hidden="true"
        />
      )

    case 'quote-accepted':
    case 'invoice-paid':
    case 'receipt-created':
      return (
        <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" aria-hidden="true" />
      )

    case 'quote-rejected':
    case 'quote-expired':
    case 'invoice-overdue':
      return <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />

    default:
      return (
        <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300 dark:bg-zinc-800 dark:ring-gray-500" />
      )
  }
}

function ActivityText({ item }: { item: Entity['events'][number] }) {
  switch (item.type) {
    case 'quote-drafted':
      return (
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the quote.
        </>
      )

    case 'quote-sent':
      return (
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Sent</span> the quote.
        </>
      )

    case 'quote-accepted':
      return (
        <>
          The quote has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">accepted</span>.
        </>
      )

    case 'quote-rejected':
      return (
        <>
          The quote has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">rejected</span>.
        </>
      )

    case 'quote-expired':
      return (
        <>
          The quote <span className="font-medium text-gray-900 dark:text-gray-100">expired</span>.
        </>
      )

    case 'invoice-drafted':
      if (item.from) {
        return (
          <>
            <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the
            invoice from a{' '}
            {match(item.from, {
              quote: () => 'quote',
            })}
            .
          </>
        )
      }

      return (
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the invoice.
        </>
      )

    case 'invoice-sent':
      return (
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Sent</span> the invoice.
        </>
      )

    case 'invoice-partially-paid':
      return (
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Partially paid</span> with{' '}
          <Money amount={item.amount} />, outstanding amount of <Money amount={item.outstanding} />{' '}
          left.
        </>
      )

    case 'invoice-paid':
      return (
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Paid</span> the invoice.
        </>
      )

    case 'invoice-overdue':
      return (
        <>
          The invoice is{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">overdue</span>.
        </>
      )

    case 'receipt-created':
      return (
        <>
          The receipt has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">created</span>.
        </>
      )

    default:
      assertNever(item)
  }
}
