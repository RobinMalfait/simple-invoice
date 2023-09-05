'use client'

import {
  CheckCircleIcon,
  ClockIcon,
  EllipsisHorizontalCircleIcon,
  LockClosedIcon,
  MapIcon,
  MapPinIcon,
  PencilSquareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { format, formatDistance, formatDistanceStrict, isFuture } from 'date-fns'
import { Event } from '~/domain/events/event'
import { classNames } from '~/ui/class-names'
import { useCurrentDate } from '~/ui/hooks/use-current-date'
import { Money } from '~/ui/money'
import { assertNever } from '~/utils/assert-never'
import { match } from '~/utils/match'
import { Address, formatAddress } from './address/address'

export function ActivityFeed({ events }: { events: Event[] }) {
  return (
    <ul role="list" className="relative flex flex-col gap-6">
      {events
        .slice()
        .reverse()
        .map((activityItem, activityItemIdx, all) => (
          <ActivityItem
            key={activityItem.id}
            previous={all[activityItemIdx - 1]}
            item={activityItem}
            isLast={activityItemIdx === all.length - 1}
          />
        ))}
    </ul>
  )
}

export function ActivityItem({
  item,
  previous,
  isLast,
}: {
  item: Event
  previous?: Event
  isLast: boolean
}) {
  let now = useCurrentDate()

  let diff: string | null = null
  if (previous && previous.at !== null && item.at !== null) {
    diff = formatDistanceStrict(previous.at, item.at)
  }

  return (
    <>
      <li className="relative flex gap-x-4">
        <div
          className={classNames(
            isLast ? 'h-6' : '-bottom-6',
            'absolute left-0 top-0 flex w-6 justify-center',
          )}
        >
          <div className="w-px bg-gray-200 dark:bg-zinc-600" />
        </div>

        <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white dark:bg-zinc-900">
          {isLast ? (
            <ActivityIndicator item={item} />
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300 dark:bg-zinc-900 dark:ring-gray-500" />
          )}
        </div>

        <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500 dark:text-gray-300">
          <ActivityText item={item} />
          {diff !== null && (
            <span className="absolute -top-5 right-0 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <ClockIcon className="h-3 w-3" /> {diff}
            </span>
          )}
        </p>

        {item.at && (
          <time
            title={format(item.at, 'PPPpp')}
            dateTime={format(item.at, 'PPPpp')}
            className="flex-none py-0.5 text-xs leading-5 text-gray-500 dark:text-gray-300"
          >
            {formatDistance(item.at, now, { addSuffix: true })}
          </time>
        )}
      </li>
    </>
  )
}

function ActivityIndicator({ item }: { item: Event }) {
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

    case 'quote-closed':
    case 'invoice-closed':
      return (
        <LockClosedIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )

    default:
      return (
        <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300 dark:bg-zinc-900 dark:ring-gray-500" />
      )
  }
}

function ActivityText({ item }: { item: Event }) {
  switch (item.type) {
    case 'account-rebranded':
      return (
        <>
          {'"'}
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.from}</span>
          {'" rebranded to "'}
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.to}</span>
          {'".'}
        </>
      )

    case 'account-relocated': {
      let encoded = new URLSearchParams({
        from: formatAddress(item.from).replace(/\n/g, ', '),
        to: formatAddress(item.to).replace(/\n/g, ', '),
      })

      return (
        <>
          <span className="inline-flex w-full items-center justify-between pr-3">
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">Account</span>{' '}
              relocated.
            </span>
            <a
              title="Open in Google Maps"
              target="_blank"
              className="relative"
              href={`https://www.google.com/maps/dir/${encoded.get('from')}/${encoded.get('to')}`}
            >
              <span className="absolute -inset-3"></span>
              <MapIcon className="h-5 w-5" />
            </a>
          </span>
          <div className="-ml-3 mt-3 flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 dark:ring-zinc-800">
            <div className="flex flex-col justify-center gap-4 text-sm leading-6 text-gray-500 dark:text-zinc-400">
              <div className="flex-1">
                <span className="text-xs font-medium dark:text-zinc-200">From</span>
                <div className="flex items-center justify-between gap-4 font-mono text-xs font-medium">
                  <Address address={item.from} />
                  <a
                    title="Open in Google Maps"
                    target="_blank"
                    className="relative"
                    href={`https://www.google.com/maps/search/?${new URLSearchParams({
                      api: '1',
                      query: encoded.get('from')!,
                    })}`}
                  >
                    <span className="absolute -inset-3"></span>
                    <MapPinIcon className="h-5 w-5" />
                  </a>
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium dark:text-zinc-200">To</span>
                <div className="flex items-center justify-between gap-4 font-mono text-xs font-medium">
                  <Address address={item.to} />
                  <a
                    title="Open in Google Maps"
                    target="_blank"
                    className="relative"
                    href={`https://www.google.com/maps/search/?${new URLSearchParams({
                      api: '1',
                      query: encoded.get('to')!,
                    })}`}
                  >
                    <span className="absolute -inset-3"></span>
                    <MapPinIcon className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )
    }

    case 'client-rebranded':
      return (
        <>
          {'"'}
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.from}</span>
          {'" rebranded to "'}
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.to}</span>
          {'".'}
        </>
      )

    case 'client-relocated': {
      let encoded = new URLSearchParams({
        from: formatAddress(item.from).replace(/\n/g, ', '),
        to: formatAddress(item.to).replace(/\n/g, ', '),
      })

      return (
        <>
          <span className="inline-flex w-full items-center justify-between pr-3">
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">Client</span>{' '}
              relocated.
            </span>
            <a
              title="Open in Google Maps"
              target="_blank"
              className="relative"
              href={`https://www.google.com/maps/dir/${encoded.get('from')}/${encoded.get('to')}`}
            >
              <span className="absolute -inset-3"></span>
              <MapIcon className="h-5 w-5" />
            </a>
          </span>
          <div className="-ml-3 mt-3 flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 dark:ring-zinc-800">
            <div className="flex flex-col justify-center gap-4 text-sm leading-6 text-gray-500 dark:text-zinc-400">
              <div className="flex-1">
                <span className="text-xs font-medium dark:text-zinc-200">From</span>
                <div className="flex items-center justify-between gap-4 font-mono text-xs font-medium">
                  <Address address={item.from} />
                  <a
                    title="Open in Google Maps"
                    target="_blank"
                    className="relative"
                    href={`https://www.google.com/maps/search/?${new URLSearchParams({
                      api: '1',
                      query: encoded.get('from')!,
                    })}`}
                  >
                    <span className="absolute -inset-3"></span>
                    <MapPinIcon className="h-5 w-5" />
                  </a>
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium dark:text-zinc-200">To</span>
                <div className="flex items-center justify-between gap-4 font-mono text-xs font-medium">
                  <Address address={item.to} />
                  <a
                    title="Open in Google Maps"
                    target="_blank"
                    className="relative"
                    href={`https://www.google.com/maps/search/?${new URLSearchParams({
                      api: '1',
                      query: encoded.get('to')!,
                    })}`}
                  >
                    <span className="absolute -inset-3"></span>
                    <MapPinIcon className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )
    }

    case 'quote-drafted': {
      if (item.from) {
        return (
          <>
            <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the quote
            from{' '}
            {match(item.from, {
              quote: () => 'another quote',
            })}
            .
          </>
        )
      }

      return (
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the quote.
        </>
      )
    }

    case 'quote-sent':
      return item.at && isFuture(item.at) ? (
        <>
          The quote will be{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">sent</span>.
        </>
      ) : (
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

    case 'quote-closed':
      return (
        <>
          The quote has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">closed</span>.
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
      return item.at && isFuture(item.at) ? (
        <>
          The invoice will be{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">sent</span>.
        </>
      ) : (
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Sent</span> the quote.
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

    case 'invoice-closed':
      return (
        <>
          The invoice has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">closed</span>.
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
