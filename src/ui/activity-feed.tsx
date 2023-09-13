'use client'

import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CakeIcon,
  CheckCircleIcon,
  ClockIcon,
  EllipsisHorizontalCircleIcon,
  FlagIcon,
  GlobeAmericasIcon,
  LockClosedIcon,
  MapIcon,
  MapPinIcon,
  PencilSquareIcon,
  SparklesIcon,
  TruckIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import {
  addSeconds,
  differenceInYears,
  format,
  formatDistance,
  formatDistanceStrict,
  formatDistanceToNowStrict,
  isFuture,
} from 'date-fns'
import Link from 'next/link'
import { ContextType, createContext, useContext, useState } from 'react'
import { Event } from '~/domain/events/event'
import { Address, formatAddress } from '~/ui/address/address'
import { useCardStructure } from '~/ui/card'
import { classNames } from '~/ui/class-names'
import { useCurrentDate } from '~/ui/hooks/use-current-date'
import { Money } from '~/ui/money'
import { assertNever } from '~/utils/assert-never'
import { match } from '~/utils/match'
import { useDatabase } from './hooks/use-db'

function isFutureEvent(event: Event): event is Extract<Event, { payload: { future: true } }> {
  if (!('payload' in event)) return false
  if (!('future' in event.payload)) return false
  return event.payload.future
}

type MappedEvent = {
  item: Event
  previous: Event | null
  idx: number
  isFirst: boolean
  isLast: boolean
}

export let ViewContext = createContext<'account' | 'client' | 'record'>('account')

export function ActivityFeed({
  events,
  viewContext,
}: {
  events: Event[]
  viewContext: ContextType<typeof ViewContext>
}) {
  let grouped = events
    .slice()
    .reverse()
    .sort((a, z) => {
      if (isFutureEvent(a) && isFutureEvent(z)) return 0
      if (isFutureEvent(a)) return -1
      if (isFutureEvent(z)) return 1
      return 0
    })
    .map((activityItem, activityItemIdx, all) => {
      return {
        item: activityItem,
        previous: all[activityItemIdx - 1] ?? null,
        idx: activityItemIdx,
        isFirst: activityItemIdx === 0,
        isLast: activityItemIdx === all.length - 1,
      } satisfies MappedEvent
    })
    .reduce(
      (acc, item) => {
        if (acc.at(-1)!.length === 0 || acc.at(-1)!.at(0)!.item.type === item.item.type) {
          acc.at(-1)!.push(item)
          return acc
        }

        acc.push([item])
        return acc
      },
      [[] as MappedEvent[]],
    )

  return (
    <ViewContext.Provider value={viewContext}>
      <ul role="list" className="relative flex flex-col gap-6 overflow-auto">
        {grouped.map((group, idx, all) => {
          return <GroupedActivities key={idx} group={group} isLast={idx === all.length - 1} />
        })}
      </ul>
    </ViewContext.Provider>
  )
}

function GroupedActivities({ group, isLast }: { group: MappedEvent[]; isLast: boolean }) {
  let limit = 2
  let shouldCollapse = group.length > limit
  let [collapsed, setCollapsed] = useState(true)

  return (
    <>
      {group.slice(0, shouldCollapse && collapsed ? 1 : group.length).map((item) => {
        return (
          <ActivityItem
            key={item.idx}
            previous={item.previous}
            item={item.item}
            isFirst={item.isFirst}
            isLast={item.isLast}
            withIndicator={true}
          />
        )
      })}

      {shouldCollapse && (
        <li className={classNames('relative -mt-4 flex gap-x-4')}>
          <div className="flex">
            <div
              className={classNames(
                isLast ? 'h-6' : '-bottom-6',
                'absolute left-0 top-0 flex w-6 justify-center',
              )}
            >
              <div className="w-px bg-gray-200 dark:bg-zinc-600" />
            </div>

            <div className="relative h-6 w-6">
              <div className="absolute left-3 top-[5px] h-2 w-4 -translate-x-[0.5px] rounded-bl-lg border-b border-l border-gray-200 dark:border-zinc-600"></div>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <div className="flex items-start gap-2">
              <button
                type="button"
                className="w-auto py-0.5 text-left text-xs leading-5 text-gray-500 dark:text-gray-300"
                onClick={() => setCollapsed((x) => !x)}
              >
                {collapsed ? (
                  <>
                    Show <span className="font-medium">{group.length - 1}</span> more
                  </>
                ) : (
                  'Show less'
                )}
              </button>
            </div>
          </div>
        </li>
      )}
    </>
  )
}

export function ActivityItem({
  item,
  previous,
  isFirst,
  isLast,
  withIndicator = isLast,
}: {
  item: Event
  previous?: Event | null
  isFirst: boolean
  isLast: boolean
  withIndicator?: boolean
}) {
  let now = useCurrentDate()

  let diff: string | null = null
  if (previous && previous.at !== null && item.at !== null) {
    diff = formatDistanceStrict(previous.at, item.at)
    if (diff === '0 seconds') {
      diff = null
    }
  }

  let [text, extra] = useActivityText(item)
  let isPotentialFutureEvent = 'payload' in item && 'future' in item.payload && item.payload.future
  let parentCardStructure = useCardStructure()

  return (
    <>
      <li
        className={classNames(
          'relative flex gap-x-4',
          isFirst &&
            (parentCardStructure === 'filled' || parentCardStructure === 'filled-vertical') &&
            'mt-4',
          isLast &&
            (parentCardStructure === 'filled' || parentCardStructure === 'filled-vertical') &&
            'mb-4',
          isPotentialFutureEvent &&
            'opacity-50 grayscale transition hover:opacity-100 hover:grayscale-0',
        )}
      >
        <div className="flex">
          <div
            className={classNames(
              isLast ? 'h-6' : '-bottom-6',
              'absolute left-0 top-0 flex w-6 justify-center',
            )}
          >
            <div className="w-px bg-gray-200 dark:bg-zinc-600" />
          </div>

          <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white dark:bg-zinc-900">
            {withIndicator ? (
              <ActivityIndicator item={item} />
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300 dark:bg-zinc-900 dark:ring-gray-500" />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex gap-2">
            <div className="flex-auto py-0.5 text-xs leading-5 text-gray-500 dark:text-gray-300">
              {text}
            </div>

            {diff !== null && (
              <span className="absolute -top-5 right-0 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <ClockIcon className="h-3 w-3" /> {diff}
              </span>
            )}

            {item.at && (
              <time
                title={format(item.at, 'PPPpp')}
                dateTime={format(item.at, 'PPPpp')}
                className="flex-none py-0.5 text-xs leading-5 text-gray-500 dark:text-gray-300"
              >
                {formatDistance(item.at, now, { addSuffix: true })}
              </time>
            )}
          </div>
          {extra}
        </div>
      </li>
    </>
  )
}

function ActivityIndicator({ item }: { item: Event }) {
  switch (item.type) {
    case 'account:relocated':
    case 'client:relocated':
      return <TruckIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />

    case 'account:rebranded':
    case 'client:rebranded':
      return (
        <SparklesIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )

    case 'milestone:fastest-accepted-quote':
      return <ClockIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />

    case 'milestone:most-expensive-invoice':
      return (
        <ArrowTrendingUpIcon
          className="h-4 w-4 text-gray-600 dark:text-gray-300"
          aria-hidden="true"
        />
      )

    case 'milestone:clients':
      return (
        <UserGroupIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )

    case 'milestone:international-clients':
      return (
        <GlobeAmericasIcon
          className="h-4 w-4 text-gray-600 dark:text-gray-300"
          aria-hidden="true"
        />
      )

    case 'milestone:revenue':
      return (
        <BanknotesIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )

    case 'milestone:invoices':
      return <FlagIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />

    case 'milestone:fastest-paid-invoice':
      return <ClockIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />

    case 'milestone:anniversary':
      return <CakeIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />

    case 'quote:drafted':
    case 'invoice:drafted':
      return (
        <PencilSquareIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )

    case 'quote:sent':
    case 'invoice:sent':
      return (
        <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-300" aria-hidden="true" />
      )

    case 'invoice:partially-paid':
      return (
        <EllipsisHorizontalCircleIcon
          className="h-6 w-6 text-orange-600 dark:text-orange-300"
          aria-hidden="true"
        />
      )

    case 'quote:accepted':
    case 'invoice:paid':
    case 'receipt:created':
      return (
        <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" aria-hidden="true" />
      )

    case 'quote:rejected':
    case 'quote:expired':
    case 'invoice:overdue':
      return <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />

    case 'quote:closed':
    case 'invoice:closed':
      return (
        <LockClosedIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )

    default:
      return (
        <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300 dark:bg-zinc-900 dark:ring-gray-500" />
      )
  }
}

function useActivityText(item: Event) {
  let viewContext = useContext(ViewContext)
  let now = useCurrentDate()
  let db = useDatabase()

  // @ts-expect-error
  let client = db.clientById.get(item.context.clientId)!
  // @ts-expect-error
  let quote = db.quoteById.get(item.context.quoteId)!
  // @ts-expect-error
  let invoice = db.invoiceById.get(item.context.invoiceId)!

  switch (item.type) {
    case 'account:rebranded':
      return [
        <>
          {'"'}
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.payload.from}</span>
          {'" rebranded to "'}
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.payload.to}</span>
          {'".'}
        </>,
      ]

    case 'account:relocated': {
      let encoded = new URLSearchParams({
        from: formatAddress(item.payload.from).replace(/\n/g, ', '),
        to: formatAddress(item.payload.to).replace(/\n/g, ', '),
      })

      return [
        <>
          <span className="inline-flex w-full items-center justify-between">
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
        </>,
        <>
          <div className="-ml-3 mt-3 flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 dark:ring-zinc-800">
            <div className="flex flex-col justify-center gap-4 text-sm leading-6 text-gray-500 dark:text-zinc-400">
              <div className="flex-1">
                <span className="text-xs font-medium dark:text-zinc-200">From</span>
                <div className="flex items-center justify-between gap-4 font-mono text-xs font-medium">
                  <Address address={item.payload.from} />
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
                  <Address address={item.payload.to} />
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
        </>,
      ]
    }

    case 'milestone:fastest-accepted-quote':
      return [
        <>
          {item.payload.best || viewContext !== 'record'
            ? `Fastest accepted quote, took `
            : `Previously fasted accepted quote, took `}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatDistanceToNowStrict(addSeconds(now, item.payload.durationInSeconds))}
          </span>
        </>,
        <>
          <span className="text-xs opacity-50">
            <Link
              className="font-medium text-gray-900 dark:text-gray-100"
              href={`/clients/${item.context.clientId}`}
            >
              {client.name}
            </Link>{' '}
            accepted quote{' '}
            <Link
              href={`/quote/${quote?.number}`}
              className="font-medium text-gray-900 dark:text-gray-100"
            >
              #{quote.number}
            </Link>{' '}
            in {formatDistanceToNowStrict(addSeconds(now, item.payload.durationInSeconds))}.
          </span>
        </>,
      ]

    case 'milestone:invoices':
      return [
        item.payload.amount === 1 ? (
          <>
            {'Your '}
            <span className="font-medium text-gray-900 dark:text-gray-100">1st</span>
            {' paid invoice!'}
          </>
        ) : (
          <>
            {item.payload.future ? 'Will reach ' : 'Reached '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {item.payload.amount}
            </span>
            {' paid invoices!'}
          </>
        ),
      ]

    case 'milestone:revenue':
      return [
        <>
          {item.payload.future ? 'Will pass ' : 'Passed '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            <Money amount={item.payload.milestone} />
            {item.payload.amount > item.payload.milestone ? '+' : ''}
          </span>
          {' in total revenue!'}
        </>,
      ]

    case 'milestone:most-expensive-invoice':
      return [
        <>
          {viewContext === 'record' ? (
            'This'
          ) : (
            <Link
              className="font-medium text-gray-900 dark:text-gray-100"
              href={`/invoice/${invoice.number}`}
            >
              {`#${invoice.number}`}
            </Link>
          )}
          {item.payload.future
            ? ` will be ${viewContext === 'account' ? 'your' : 'the'} most expensive invoice (`
            : ` ${item.payload.best || viewContext !== 'record' ? 'is ' : 'was '} ${
                viewContext === 'account' ? 'your' : 'the'
              } most expensive invoice ${
                item.payload.best || viewContext !== 'record' ? '' : 'at this time '
              }(`}
          <span className="font-medium text-emerald-500 dark:text-emerald-400/60">
            +{item.payload.increase}%
          </span>
          {`).`}
        </>,
        viewContext !== 'record' && (
          <>
            <span className="text-xs opacity-50">
              This invoice {item.payload.future ? 'is' : 'was'}{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                <Money amount={item.payload.amount} />
              </span>
              .
            </span>
          </>
        ),
      ].filter(Boolean)

    case 'milestone:clients':
      return [
        <>
          {item.payload.future ? 'Will attract ' : 'Attracted '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {item.payload.amount}
          </span>
          {' paying clients!'}
        </>,
      ]

    case 'milestone:international-clients':
      return item.payload.amount === 1
        ? [
            <>
              {item.payload.future ? 'Will be your ' : 'Your '}
              <span className="font-medium text-gray-900 dark:text-gray-100">1st</span>
              {' international client!'}
            </>,
          ]
        : [
            <>
              {item.payload.future ? 'Will reach ' : 'Worked with '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.payload.amount}
              </span>
              {' international clients!'}
            </>,
          ]

    case 'milestone:fastest-paid-invoice':
      return [
        <>
          {item.payload.best || viewContext !== 'record'
            ? `Fastest paid invoice, took `
            : `Previously fasted paid invoice, took `}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatDistanceToNowStrict(addSeconds(now, item.payload.durationInSeconds))}
          </span>
        </>,
        viewContext !== 'record' && (
          <>
            <span className="text-xs opacity-50">
              <Link
                className="font-medium text-gray-900 dark:text-gray-100"
                href={`/clients/${item.context.clientId}`}
              >
                {client.name}
              </Link>{' '}
              paid invoice{' '}
              <Link
                href={`/invoice/${invoice.number}`}
                className="font-medium text-gray-900 dark:text-gray-100"
              >
                #{invoice.number}
              </Link>{' '}
              in {formatDistanceToNowStrict(addSeconds(now, item.payload.durationInSeconds))}.
            </span>
          </>
        ),
      ].filter(Boolean)

    case 'milestone:anniversary':
      return [
        <>
          {'Congratulations with your '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {differenceInYears(item.at!, item.payload.start)}
          </span>{' '}
          year anniversary!
        </>,
      ]

    case 'client:rebranded':
      return [
        <>
          {'"'}
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.payload.from}</span>
          {'" rebranded to "'}
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.payload.to}</span>
          {'".'}
        </>,
      ]

    case 'client:relocated': {
      let encoded = new URLSearchParams({
        from: formatAddress(item.payload.from).replace(/\n/g, ', '),
        to: formatAddress(item.payload.to).replace(/\n/g, ', '),
      })

      return [
        <>
          <span className="inline-flex w-full items-center justify-between">
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
        </>,
        <>
          <div className="-ml-3 mt-3 flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 dark:ring-zinc-800">
            <div className="flex flex-col justify-center gap-4 text-sm leading-6 text-gray-500 dark:text-zinc-400">
              <div className="flex-1">
                <span className="text-xs font-medium dark:text-zinc-200">From</span>
                <div className="flex items-center justify-between gap-4 font-mono text-xs font-medium">
                  <Address address={item.payload.from} />
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
                  <Address address={item.payload.to} />
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
        </>,
      ]
    }

    case 'quote:drafted': {
      if (item.payload.from) {
        return [
          <>
            <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the quote
            from{' '}
            {match(item.payload.from, {
              quote: () => 'another quote',
            })}
            .
          </>,
        ]
      }

      return [
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the quote.
        </>,
      ]
    }

    case 'quote:sent':
      return item.at && isFuture(item.at)
        ? [
            <>
              The quote will be{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">sent</span>.
            </>,
          ]
        : [
            <>
              <span className="font-medium text-gray-900 dark:text-gray-100">Sent</span> the quote.
            </>,
          ]

    case 'quote:accepted':
      return [
        <>
          The quote has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">accepted</span>.
        </>,
      ]

    case 'quote:rejected':
      return [
        <>
          The quote has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">rejected</span>.
        </>,
      ]

    case 'quote:expired':
      return [
        <>
          The quote <span className="font-medium text-gray-900 dark:text-gray-100">expired</span>.
        </>,
      ]

    case 'quote:closed':
      return [
        <>
          The quote has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">closed</span>.
        </>,
      ]

    case 'invoice:drafted':
      if (item.payload.from) {
        return [
          <>
            <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the
            invoice from a{' '}
            {match(item.payload.from, {
              quote: () => 'quote',
            })}
            .
          </>,
        ]
      }

      return [
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Drafted</span> the invoice.
        </>,
      ]

    case 'invoice:sent':
      return item.at && isFuture(item.at)
        ? [
            <>
              The invoice will be{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">sent</span>.
            </>,
          ]
        : [
            <>
              <span className="font-medium text-gray-900 dark:text-gray-100">Sent</span> the
              invoice.
            </>,
          ]

    case 'invoice:partially-paid':
      return [
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Partially paid</span> with{' '}
          <Money amount={item.payload.amount} />, outstanding amount of{' '}
          <Money amount={item.payload.outstanding} /> left.
        </>,
      ]

    case 'invoice:paid':
      return [
        <>
          <span className="font-medium text-gray-900 dark:text-gray-100">Paid</span> the invoice.
        </>,
      ]

    case 'invoice:overdue':
      return [
        <>
          The invoice is{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">overdue</span>.
        </>,
      ]

    case 'invoice:closed':
      return [
        <>
          The invoice has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">closed</span>.
        </>,
      ]

    case 'receipt:created':
      return [
        <>
          The receipt has been{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">created</span>.
        </>,
      ]

    default:
      assertNever(item)
  }
}
