'use client'

import {
  CheckCircleIcon,
  ClockIcon,
  EllipsisHorizontalCircleIcon,
  LockClosedIcon,
  PencilSquareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceStrict, formatDistanceToNow } from 'date-fns'
import { Fragment } from 'react'
import { Event } from '~/domain/events/event'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { classNames } from '~/ui/class-names'
import { useInvoice } from '~/ui/hooks/use-invoice'
import { Money } from '~/ui/money'
import { assertNever } from '~/utils/assert-never'
import { match } from '~/utils/match'
import { useInvoiceStacks } from '../hooks/use-invoice-stacks'

type Entity = Quote | Invoice | Receipt

export function ActivityFeed(props: React.PropsWithChildren<{ entities: Entity[] }>) {
  let stacks = useInvoiceStacks()
  let entity = useInvoice()
  let entities = (stacks[entity.id] ?? []).map((id) => props.entities.find((e) => e.id === id)!)

  let activeEntityIdx = stacks[entity.id]?.indexOf(entity.id) ?? -1

  return (
    <>
      <ul role="list" className="space-y-6">
        {entities.map((entity, idx) => {
          return (
            <Fragment key={entity.id}>
              {entities.length !== 1 && (
                <li
                  className={classNames(
                    'relative flex items-center text-sm',
                    idx > activeEntityIdx && 'opacity-50 grayscale',
                  )}
                >
                  <span className="pr-3">
                    {match(entity.type, {
                      quote: () => 'Quote',
                      invoice: () => 'Invoice',
                      receipt: () => 'Receipt',
                    })}
                  </span>
                  <span className="h-px w-full bg-gray-200 dark:bg-zinc-600"></span>
                </li>
              )}

              <ul
                role="list"
                className={classNames(
                  'relative flex flex-col gap-6',
                  idx > activeEntityIdx && 'opacity-50 grayscale',
                  entities.length !== 1 && 'mt-6',
                )}
              >
                {entity.events.map((activityItem, activityItemIdx, all) => (
                  <ActivityItem
                    key={activityItem.id}
                    previous={all[activityItemIdx - 1]}
                    item={activityItem}
                    isLast={activityItemIdx === entity.events.length - 1}
                  />
                ))}
              </ul>
            </Fragment>
          )
        })}
      </ul>
    </>
  )
}

function ActivityItem({
  item,
  previous,
  isLast,
}: {
  item: Event
  previous?: Event
  isLast: boolean
}) {
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
            title={item.at.toLocaleString()}
            dateTime={item.at.toISOString()}
            className="flex-none py-0.5 text-xs leading-5 text-gray-500 dark:text-gray-300"
          >
            {formatDistanceToNow(item.at, { addSuffix: true })}
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
