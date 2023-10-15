'use client'

import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { ArrowSmallLeftIcon, ArrowSmallRightIcon } from '@heroicons/react/24/outline'
import {
  addHours,
  addSeconds,
  addYears,
  compareAsc,
  differenceInDays,
  differenceInHours,
  differenceInSeconds,
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  endOfDay,
  endOfHour,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  formatDistanceStrict,
  isAfter,
  isSameMonth,
  isSameWeek,
  isWithinInterval,
  subHours,
  subYears,
} from 'date-fns'
import Link from 'next/link'
import {
  ContextType,
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Invoice } from '~/domain/invoice/invoice'
import {
  isAccepted,
  isActiveRecord,
  isCancelled,
  isClosed,
  isDraft,
  isExpired,
  isInvoice,
  isOverdue,
  isPaid,
  isPaidRecord,
  isPartiallyPaid,
  isQuote,
  isReceipt,
  isRejected,
  isSent,
} from '~/domain/record/filters'
import { Record, resolveRelevantRecordDate, separateRecords } from '~/domain/record/record'
import { Card, CardBody, CardTitle } from '~/ui/card'
import { classNames } from '~/ui/class-names'
import { Classified, useIsClassified } from '~/ui/classified'
import { FormatRange } from '~/ui/date-range'
import { Empty } from '~/ui/empty'
import { useCurrencyFormatter } from '~/ui/hooks/use-currency-formatter'
import { useCurrentDate } from '~/ui/hooks/use-current-date'
import { useLazyEventsForRecord } from '~/ui/hooks/use-events-by'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { RangePicker, options } from '~/ui/range-picker'
import { TinyRecord } from '~/ui/record/tiny-record'
import { match } from '~/utils/match'
import { setDashboardConfig } from '../(db)/actions'

type Milestones = {
  clientCountMilestonesData: number[]
  internationalClientCountMilestonesData: number[]
  invoiceCountMilestonesData: number[]
  revenueMilestonesData: number[]
}

type DashboardConfig = {
  preset: string
  strategy: 'previous-period' | 'last-year'
  offset: number
}

export function Dashboard({
  me,
  records,
  milestones,
  dashboardConfig,
}: {
  me: Account
  records: Record[]
  milestones: Milestones
  dashboardConfig: DashboardConfig
}) {
  let allRecords = separateRecords(records)
  let systemContainsQuotes = allRecords.some((r) => isQuote(r))
  let systemContainsInvoices = allRecords.some((r) => isInvoice(r))

  return (
    <DashboardProvider data={{ account: me, records, milestones, config: dashboardConfig }}>
      <div
        data-no-quotes={systemContainsQuotes ? null : true}
        data-no-invoices={systemContainsInvoices ? null : true}
        className="group grid grid-flow-row-dense grid-cols-2 gap-[--gap] px-4 py-8 [--gap:theme(spacing.4)] sm:px-6 lg:grid-cols-10 lg:px-8"
      >
        <ActionsBar className="col-span-full" />
        {systemContainsQuotes && (
          <QuotesCell className="lg:col-span-2 lg:row-span-2 lg:group-data-[no-invoices]:col-span-3" />
        )}
        {systemContainsInvoices && (
          <InvoicesCell className="lg:col-span-2 lg:row-span-2 lg:group-data-[no-quotes]:col-span-3" />
        )}
        <GoalsCell className="lg:col-span-2 lg:row-span-2 lg:group-data-[no-quotes]:col-span-3" />
        <ReceiptsCell className="col-span-1 row-span-1" />
        <UniqueClientsCell className="col-span-1 row-span-1" />
        <BestPayingClientCell className="row-span-1 lg:col-span-2" />
        <OutstandingCell className="row-span-1 lg:col-span-2" />
        <PaidCell className="row-span-1 lg:col-span-2" />
        <ActiveRecordsCell className="col-span-2 lg:col-span-5 lg:row-start-4" />
        <AccumulativePaidInvoicesChartCell className="col-span-2 lg:col-span-5 lg:row-start-4" />
        {systemContainsQuotes && <FastestAcceptedQuoteCell className="lg:col-span-2" />}
        {systemContainsQuotes && <SlowestAcceptedQuoteCell className="lg:col-span-2" />}
        <FastestPayingClientCell className="lg:col-span-2" />
        <SlowestPayingClientCell className="lg:col-span-2" />
        <TopPayingClientsCell className="lg:col-span-4" />
        <PaidInvoicesChartCell className="col-span-2 lg:col-span-6 lg:col-start-5 lg:row-span-3 lg:row-start-5 lg:group-data-[no-quotes]:row-span-2 lg:group-data-[no-quotes]:row-start-5" />
      </div>
    </DashboardProvider>
  )
}

// ---

function DashboardProvider({
  children,
  data: { account, records, milestones, config },
}: {
  children: React.ReactNode
  data: {
    account: Account
    records: Record[]
    milestones: Milestones
    config: DashboardConfig
  }
}) {
  let now = useCurrentDate()
  let [state, dispatch] = useReducer(dashboardReducer, {
    preset: config.preset,
    strategy: config.strategy,
    offset: config.offset,
  })

  useEffect(() => {
    setDashboardConfig(state)
  }, [state])

  // Preset
  let range = useMemo(() => options.find((e) => e[0] === state.preset)![1], [state.preset])

  // Compute maximum allowed range
  let [earliestDate = now, latestDate = now] = useMemo(() => {
    if (records.length <= 0) return [undefined, undefined]

    let sortedRecords = records
      .slice()
      .sort((a, z) => compareAsc(resolveRelevantRecordDate(a), resolveRelevantRecordDate(z)))

    let earliest = sortedRecords[0]
    let latest = sortedRecords[sortedRecords.length - 1]

    return [resolveRelevantRecordDate(earliest), resolveRelevantRecordDate(latest)]
  }, [records])

  let currentRange = useMemo(() => {
    let [start = earliestDate, end = latestDate] = range(now, state.offset)
    return { start, end }
  }, [earliestDate, latestDate, range, now, state.offset])

  let previousRange = useMemo(() => {
    return match(state.strategy, {
      'previous-period': () => {
        let [start = earliestDate, end = latestDate] = range(now, state.offset - 1)
        return { start, end }
      },
      'last-year': () => {
        return {
          start: subYears(currentRange.start, 1),
          end: subYears(currentRange.end, 1),
        }
      },
    })
  }, [currentRange.end, currentRange.start, earliestDate, latestDate, now, range, state])

  let previousRecords = useMemo(() => {
    return records.filter((r) => isWithinInterval(resolveRelevantRecordDate(r), previousRange))
  }, [records, previousRange])

  let currentRecords = useMemo(() => {
    return records.filter((r) => isWithinInterval(resolveRelevantRecordDate(r), currentRange))
  }, [records, currentRange])

  let data: ContextType<typeof DashboardDataContext> = {
    preset: state.preset,
    strategy: state.strategy,
    previous: previousRecords,
    current: currentRecords,
    previousRange,
    currentRange,
    milestones,
  }

  let actions = useMemo<ContextType<typeof DashboardActionsContext>>(() => {
    return {
      choosePreset: (preset) => dispatch({ type: ActionTypes.ChoosePreset, preset }),
      chooseStrategy: (strategy) => dispatch({ type: ActionTypes.ChooseStrategy, strategy }),
      previous: () => dispatch({ type: ActionTypes.Previous }),
      today: () => dispatch({ type: ActionTypes.Today }),
      next: () => dispatch({ type: ActionTypes.Next }),
    }
  }, [dispatch])

  return (
    <DashboardActionsContext.Provider value={actions}>
      <I18NProvider value={{ language: account.language, currency: account.currency }}>
        <CompareConfigContext.Provider
          value={{
            previous: data.preset === 'All' ? [] : previousRecords,
            current: currentRecords,
            withDiff: data.preset === 'All' ? false : isAfter(previousRange.end, earliestDate),
          }}
        >
          <DashboardDataContext.Provider value={data}>{children}</DashboardDataContext.Provider>
        </CompareConfigContext.Provider>
      </I18NProvider>
    </DashboardActionsContext.Provider>
  )
}

// ---

let DashboardDataContext = createContext<{
  preset: DashboardState['preset']
  strategy: DashboardState['strategy']
  milestones: Milestones
  current: Record[]
  previous: Record[]
  currentRange: {
    start: Date
    end: Date
  }
  previousRange: {
    start: Date
    end: Date
  }
} | null>(null)
function useDashboardData() {
  let context = useContext(DashboardDataContext)
  if (context === null) {
    throw new Error('useDashboardData() is used without a parent <DashboardProvider />')
  }
  return context
}

let DashboardActionsContext = createContext<{
  choosePreset(preset: DashboardState['preset']): void
  chooseStrategy(strategy: DashboardState['strategy']): void

  previous(): void
  today(): void
  next(): void
} | null>(null)
function useDashboardActions() {
  let context = useContext(DashboardActionsContext)
  if (context === null) {
    throw new Error('useDashboardActions() is used without a parent <DashboardProvider />')
  }
  return context
}

// ---

type DashboardState = {
  preset: string
  strategy: 'previous-period' | 'last-year'
  offset: number
}

enum ActionTypes {
  // Configuration
  ChoosePreset,
  ChooseStrategy,

  // Actions
  Previous,
  Today,
  Next,
}

type Actions =
  | { type: ActionTypes.ChoosePreset; preset: DashboardState['preset'] }
  | { type: ActionTypes.ChooseStrategy; strategy: DashboardState['strategy'] }
  | { type: ActionTypes.Previous }
  | { type: ActionTypes.Today }
  | { type: ActionTypes.Next }

let reducers: {
  [P in ActionTypes]: (
    state: DashboardState,
    action: Extract<Actions, { type: P }>,
  ) => DashboardState
} = {
  [ActionTypes.ChoosePreset](state, action) {
    return { ...state, preset: action.preset, offset: 0 }
  },
  [ActionTypes.ChooseStrategy](state, action) {
    return { ...state, strategy: action.strategy }
  },
  [ActionTypes.Previous](state) {
    return { ...state, offset: state.offset - 1 }
  },
  [ActionTypes.Today](state) {
    return { ...state, offset: 0 }
  },
  [ActionTypes.Next](state) {
    return { ...state, offset: state.offset + 1 }
  },
}

function dashboardReducer(state: DashboardState, action: Actions) {
  return match(action.type, reducers, state, action)
}

function ActionsBar({ className }: { className?: string }) {
  let data = useDashboardData()
  let actions = useDashboardActions()

  return (
    <div
      className={classNames(
        'sticky top-0 z-10 -mx-8 -mb-[calc(var(--gap)-1px)] -mt-[--gap] flex items-center justify-between bg-gray-100/20 px-8 py-[--gap] backdrop-blur dark:bg-zinc-800/20',
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            title="Previous period"
            className="aspect-square rounded-md bg-white px-2 py-1.5 text-sm shadow ring-1 ring-black/10 dark:bg-zinc-900/75 dark:text-zinc-300"
            onClick={() => actions.previous()}
          >
            <ArrowSmallLeftIcon className="h-4 w-4" />
          </button>

          <button
            title="Current period"
            className="aspect-square rounded-md bg-white px-2 py-1.5 text-sm shadow ring-1 ring-black/10 dark:bg-zinc-900/75 dark:text-zinc-300"
            onClick={() => {
              actions.today()
            }}
          >
            <div className="flex h-4 w-4 items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
            </div>
          </button>

          <button
            title="Next period"
            className="aspect-square rounded-md bg-white px-2 py-1.5 text-sm shadow ring-1 ring-black/10 dark:bg-zinc-900/75 dark:text-zinc-300"
            onClick={() => actions.next()}
          >
            <ArrowSmallRightIcon className="h-4 w-4" />
          </button>

          <RangePicker
            value={data.preset}
            start={data.currentRange.start}
            end={data.currentRange.end}
            onChange={(preset) => actions.choosePreset(preset)}
          />

          {data.preset !== 'All' && (
            <div className="flex items-center gap-2 text-xs dark:text-zinc-400">
              <span>vs</span>
              <span className="text-sm dark:text-zinc-300">
                <FormatRange start={data.previousRange.start} end={data.previousRange.end} />
              </span>
            </div>
          )}
        </div>

        <div
          data-all={data.preset === 'All' ? true : undefined}
          className="flex items-center gap-2 self-end data-[all]:opacity-50"
        >
          <span className="dark:text-zinc-300">Compare to:</span>
          <div className="flex gap-2 rounded-lg bg-gray-200 p-1 shadow-inner dark:bg-zinc-700/50">
            {(
              [
                ['previous-period', 'Previous period'],
                ['last-year', 'Same period last year'],
              ] as [typeof data.strategy, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => actions.chooseStrategy(key)}
                className={classNames(
                  'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm dark:text-zinc-300',
                  data.strategy === key &&
                    'bg-white shadow ring-1 ring-black/10 dark:bg-zinc-900/75',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---

function QuotesCell({ className }: { className?: string }) {
  return (
    <CompareGroup horizontalCount={5} className={className}>
      <CompareBlock
        title="Quotes"
        value={(list) => separateRecords(list).filter((r) => isQuote(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Draft"
        value={(list) => separateRecords(list).filter((r) => isQuote(r) && isDraft(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Sent"
        value={(list) => separateRecords(list).filter((r) => isQuote(r) && isSent(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Accepted"
        value={(list) => separateRecords(list).filter((r) => isQuote(r) && isAccepted(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Cancelled"
        value={(list) => separateRecords(list).filter((r) => isQuote(r) && isCancelled(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Rejected"
        value={(list) => separateRecords(list).filter((r) => isQuote(r) && isRejected(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Expired"
        value={(list) => separateRecords(list).filter((r) => isQuote(r) && isExpired(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Closed"
        value={(list) => separateRecords(list).filter((r) => isQuote(r) && isClosed(r)).length}
      />
    </CompareGroup>
  )
}

function InvoicesCell({ className }: { className?: string }) {
  return (
    <CompareGroup horizontalCount={4} className={className}>
      <CompareBlock
        title="Invoices"
        value={(list) => separateRecords(list).filter((r) => isInvoice(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Draft"
        value={(list) => separateRecords(list).filter((r) => isInvoice(r) && isDraft(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Sent"
        value={(list) => separateRecords(list).filter((r) => isInvoice(r) && isSent(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Paid"
        value={(list) => separateRecords(list).filter((r) => isInvoice(r) && isPaid(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Partially paid"
        value={(list) =>
          separateRecords(list).filter((r) => isInvoice(r) && isPartiallyPaid(r)).length
        }
      />
      <CompareBlock
        variant="tiny"
        title="Overdue"
        value={(list) => separateRecords(list).filter((r) => isInvoice(r) && isOverdue(r)).length}
      />
      <CompareBlock
        variant="tiny"
        title="Closed"
        value={(list) => separateRecords(list).filter((r) => isInvoice(r) && isClosed(r)).length}
      />
    </CompareGroup>
  )
}

function ReceiptsCell({ className }: { className?: string }) {
  return (
    <CompareBlock
      className={className}
      title="Receipts"
      value={(list) => separateRecords(list).filter((r) => isReceipt(r)).length}
    />
  )
}

function UniqueClientsCell({ className }: { className?: string }) {
  return (
    <CompareBlock
      className={className}
      title="Unique clients"
      value={(list) => new Set(separateRecords(list).map((r) => r.client.id)).size}
    />
  )
}

function BestPayingClientCell({ className }: { className?: string }) {
  return (
    <CompareBlock<readonly [Client | null, number | null]>
      className={className}
      title="Best paying client"
      data={(list) => {
        let interestingRecords = separateRecords(list).filter(
          (r) => isInvoice(r) && (isPaid(r) || isPartiallyPaid(r)),
        )
        let winner: string | null = null
        let clients = []
        let byClient = new Map()
        for (let record of interestingRecords) {
          clients.push(record.client)
          if (!byClient.has(record.client.id)) {
            byClient.set(record.client.id, 0)
          }
          byClient.set(record.client.id, byClient.get(record.client.id) + total(record))

          if (byClient.get(record.client.id) > (byClient.get(winner) ?? 0)) {
            winner = record.client.id
          }
        }
        clients = clients.filter(
          (c, idx, all) => all.findIndex((other) => other.id === c.id) === idx,
        )

        return [clients.find((c) => c.id === winner) ?? null, byClient.get(winner) ?? null] as const
      }}
      value={(data) => data?.[1] ?? null}
      display={(value) => <Money amount={value} />}
      footer={(data) =>
        data?.[0] && (
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            <Link href={`/clients/${data[0].id}`}>
              <span className="absolute inset-0"></span>
              <Classified>{data[0].nickname}</Classified>
            </Link>
          </div>
        )
      }
    />
  )
}

function OutstandingCell({ className }: { className?: string }) {
  return (
    <CompareBlock
      className={className}
      inverse
      title="Outstanding"
      value={(list) =>
        list
          .filter((e) => isInvoice(e) && (isSent(e) || isPartiallyPaid(e)))
          .reduce((acc, r) => acc + (r as Invoice).outstanding, 0)
      }
      display={(value) => <Money amount={value} />}
    />
  )
}

function PaidCell({ className }: { className?: string }) {
  return (
    <CompareBlock
      className={className}
      title="Paid"
      value={(list) => list.filter((e) => isPaidRecord(e)).reduce((acc, e) => acc + total(e), 0)}
      display={(value) => <Money amount={value} />}
    />
  )
}

function ActiveRecordsCell({ className }: { className?: string }) {
  let { current } = useContext(CompareConfigContext)
  let data = current.filter((e) => isActiveRecord(e)).reverse()

  return (
    <div
      className={classNames(
        'flex flex-1 flex-col overflow-auto rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-zinc-900',
        data.length === 0 && 'opacity-50 transition-opacity duration-300 hover:opacity-100',
        className,
      )}
    >
      <div className="border-b p-4 dark:border-zinc-700/75 dark:text-zinc-400">
        Active quotes / invoices ({data.length})
      </div>
      {data.length > 0 ? (
        <div className="grid auto-cols-[280px] grid-flow-col grid-cols-[repeat(auto-fill,280px)] grid-rows-1 gap-4 overflow-x-auto p-4 [scrollbar-width:auto]">
          {data.map((record) => (
            <I18NProvider
              key={record.id}
              value={{
                // Prefer the language of the account when looking at the overview of invoices.
                language: record.account.language,

                // Prefer the currency of the client when looking at the overview of invoices.
                currency: record.client.currency,
              }}
            >
              <Link href={`/${record.type}/${record.number}`}>
                <TinyRecord record={record} />
              </Link>
            </I18NProvider>
          ))}
        </div>
      ) : (
        <Empty message="No active quotes / invoices available" />
      )}
    </div>
  )
}

function FastestAcceptedQuoteCell({ className }: { className?: string }) {
  let now = useCurrentDate()
  let eventsBy = useLazyEventsForRecord()

  return (
    <CompareBlock<readonly [Record, number] | null>
      className={className}
      inverse
      title={'Fastest accepted quote'}
      data={(list) =>
        separateRecords(list)
          .filter((r) => isQuote(r) && isAccepted(r))
          .flatMap((r) => {
            let sentAt = eventsBy(r).find((e) => e.type === 'quote:sent')?.at
            if (!sentAt) return []

            let paidAt = eventsBy(r).find((e) => e.type === 'quote:accepted')?.at
            if (!paidAt) return []

            return [[r, differenceInSeconds(paidAt, sentAt)] as const]
          })
          .sort(([, a], [, z]) => z - a)
          .pop() ?? null
      }
      value={(data) => data?.[1] ?? null}
      display={(value) => <span>{formatDistanceStrict(now, addSeconds(now, value))}</span>}
      footer={(data) =>
        data && (
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            <Link href={`/${data[0].type}/${data[0].number}`}>
              <span className="absolute inset-0"></span>
              <Classified>{data[0].client.nickname}</Classified>{' '}
              <small className="tabular-nums">— {data[0].number}</small>
            </Link>
          </div>
        )
      }
    />
  )
}

function SlowestAcceptedQuoteCell({ className }: { className?: string }) {
  let now = useCurrentDate()
  let eventsBy = useLazyEventsForRecord()

  return (
    <CompareBlock<readonly [Record, number] | null>
      className={className}
      inverse
      title={'Slowest accepted quote'}
      data={(list) =>
        separateRecords(list)
          .filter((r) => isQuote(r) && isAccepted(r))
          .flatMap((r) => {
            let sentAt = eventsBy(r).find((e) => e.type === 'quote:sent')?.at
            if (!sentAt) return []

            let paidAt = eventsBy(r).find((e) => e.type === 'quote:accepted')?.at
            if (!paidAt) return []

            return [[r, differenceInSeconds(paidAt, sentAt)] as const]
          })
          .sort(([, a], [, z]) => a - z)
          .pop() ?? null
      }
      value={(data) => data?.[1] ?? null}
      display={(value) => <span>{formatDistanceStrict(now, addSeconds(now, value))}</span>}
      footer={(data) =>
        data && (
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            <Link href={`/${data[0].type}/${data[0].number}`}>
              <span className="absolute inset-0"></span>
              <Classified>{data[0].client.nickname}</Classified>{' '}
              <small className="tabular-nums">— {data[0].number}</small>
            </Link>
          </div>
        )
      }
    />
  )
}

function FastestPayingClientCell({ className }: { className?: string }) {
  let now = useCurrentDate()
  let eventsBy = useLazyEventsForRecord()

  return (
    <CompareBlock<readonly [Record, number] | null>
      inverse
      className={className}
      title={'Fastest paying client'}
      data={(list) =>
        separateRecords(list)
          .filter((r) => isPaidRecord(r))
          .map((r) => (isReceipt(r) ? r.invoice : r))
          .flatMap((r) => {
            let sentAt = eventsBy(r).find((e) => e.type === 'invoice:sent')?.at
            if (!sentAt) return []

            let paidAt = eventsBy(r).find((e) => e.type === 'invoice:paid')?.at
            if (!paidAt) return []

            return [[r, differenceInSeconds(paidAt, sentAt)] as const]
          })
          .sort(([, a], [, z]) => z - a)
          .pop() ?? null
      }
      value={(data) => data?.[1] ?? null}
      display={(value) => <span>{formatDistanceStrict(now, addSeconds(now, value))}</span>}
      footer={(data) =>
        data && (
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            <Link href={`/${data[0].type}/${data[0].number}`}>
              <span className="absolute inset-0"></span>
              <Classified>{data[0].client.nickname}</Classified>{' '}
              <small className="tabular-nums">— {data[0].number}</small>
            </Link>
          </div>
        )
      }
    />
  )
}

function SlowestPayingClientCell({ className }: { className?: string }) {
  let now = useCurrentDate()
  let eventsBy = useLazyEventsForRecord()

  return (
    <CompareBlock<readonly [Record, number] | null>
      inverse
      className={className}
      title={'Slowest paying client'}
      data={(list) =>
        separateRecords(list)
          .filter((r) => isPaidRecord(r))
          .map((r) => (isReceipt(r) ? r.invoice : r))
          .flatMap((r) => {
            let sentAt = eventsBy(r).find((e) => e.type === 'invoice:sent')?.at
            if (!sentAt) return []

            let paidAt = eventsBy(r).find((e) => e.type === 'invoice:paid')?.at
            if (!paidAt) return []

            return [[r, differenceInSeconds(paidAt, sentAt)] as const]
          })
          .sort(([, a], [, z]) => a - z)
          .pop() ?? null
      }
      value={(data) => data?.[1] ?? null}
      display={(value) => <span>{formatDistanceStrict(now, addSeconds(now, value))}</span>}
      footer={(data) =>
        data && (
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            <Link href={`/${data[0].type}/${data[0].number}`}>
              <span className="absolute inset-0"></span>
              <Classified>{data[0].client.nickname}</Classified>{' '}
              <small className="tabular-nums">— {data[0].number}</small>
            </Link>
          </div>
        )
      }
    />
  )
}

function TopPayingClientsCell({ className }: { className?: string }) {
  let { current } = useContext(CompareConfigContext)
  let totalInvoiceSales = current
    .filter((e) => isPaidRecord(e))
    .reduce((acc, e) => acc + total(e), 0)

  let data = Array.from(
    current
      .reduce((acc, e) => {
        if (!isPaidRecord(e)) return acc

        if (!acc.has(e.client.id)) {
          acc.set(e.client.id, { client: e.client, total: 0 })
        }
        acc.get(e.client.id)!.total += total(e)
        return acc
      }, new Map<Client['id'], { client: Client; total: number }>())
      .entries(),
  )
    .sort(([, a], [, z]) => z.total - a.total) // Sort by best paying client first.
    .slice(0, 5) // Only show the top 5.

  return (
    <div
      className={classNames(
        'flex-1 overflow-auto rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-zinc-900',
        data.length === 0 && 'opacity-50 transition-opacity duration-300 hover:opacity-100',
        className,
      )}
    >
      <div className="border-b p-4 dark:border-zinc-700/75 dark:text-zinc-400">
        Top paying clients
      </div>
      {data.length > 0 ? (
        <div className="flex-1 divide-y divide-gray-100 dark:divide-zinc-900">
          {data.map(([id, { client, total }], idx) => (
            <I18NProvider key={id} value={client}>
              <Link
                href={`/clients/${client.id}`}
                className="group relative flex items-center p-3 first:border-t-[1px] first:border-t-transparent focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:border-zinc-700"
              >
                <div className="absolute inset-2 z-0 flex">
                  <div
                    className="rounded-md bg-blue-200/30 dark:bg-blue-400/25"
                    style={{ width: `${(total / totalInvoiceSales) * 100}%` }}
                  />
                </div>
                <div className="z-10 flex w-full items-center space-x-2">
                  <span className="w-[2ch] text-right text-sm font-medium tabular-nums text-gray-400 dark:text-zinc-400">
                    {idx + 1}.
                  </span>
                  <div className="flex flex-1 items-center justify-between space-x-2 truncate dark:text-zinc-300">
                    <span className="truncate">
                      <Classified>{client.nickname}</Classified>
                    </span>
                    <span className="text-xs">
                      <Money amount={total} />
                      <small className="mx-1 inline-block w-[4ch] flex-shrink-0 text-right">
                        {((total / totalInvoiceSales) * 100).toFixed(0)}%
                      </small>
                    </span>
                  </div>
                </div>
              </Link>
            </I18NProvider>
          ))}
        </div>
      ) : (
        <Empty message="No clients available" />
      )}
    </div>
  )
}

function PaidInvoicesChartCell({ className }: { className?: string }) {
  let data = useDashboardData()
  let config = useContext(CompareConfigContext)

  let rangeDifferenceInHours = useMemo(() => {
    return Math.max(
      differenceInHours(data.currentRange.start, data.previousRange.start),
      differenceInHours(data.currentRange.end, data.previousRange.end),
    )
  }, [data.previousRange, data.currentRange])
  let previous = useCallback(
    (value: Date) => {
      return match(data.strategy, {
        'previous-period': () => subHours(value, rangeDifferenceInHours),
        'last-year': () => subYears(value, 1),
      })
    },
    [data.strategy, rangeDifferenceInHours],
  )
  let next = useCallback(
    (value: Date) => {
      return match(data.strategy, {
        'previous-period': () => addHours(value, rangeDifferenceInHours),
        'last-year': () => addYears(value, 1),
      })
    },
    [data.strategy, rangeDifferenceInHours],
  )

  return (
    <ComparisonChart
      className={className}
      currentRange={data.currentRange}
      previousRecords={config.previous}
      currentRecords={config.current}
      previous={previous}
      next={next}
    />
  )
}

// ---

function GoalsCell({ className }: { className?: string }) {
  let data = useDashboardData()
  let goals = createGoals(data.current, data.milestones)
  if (goals.length <= 0) return null

  return <Goals className={className} goals={goals} />
}

function Goals({ className, goals }: { className?: string; goals: Goal[] }) {
  let [index, setIndex] = useState(0)
  let goal = goals[index]

  return (
    <Card className={className}>
      <CardTitle>
        <span className="flex items-center justify-between">
          <span>Goals</span>
          <div className="flex items-center gap-2">
            <button
              className="relative -m-2 p-2"
              onClick={() => setIndex((v) => (v + goals.length - 1) % goals.length)}
            >
              <ArrowSmallLeftIcon className="h-4 w-4" />
            </button>
            <span className="font-mono tabular-nums">
              {index + 1}/{goals.length}
            </span>
            <button
              className="relative -m-2 p-2"
              onClick={() => setIndex((v) => (v + goals.length + 1) % goals.length)}
            >
              <ArrowSmallRightIcon className="h-4 w-4" />
            </button>
          </div>
        </span>
      </CardTitle>
      <CardBody>
        <div className="flex h-full flex-1 flex-col [--current:theme(colors.blue.500)] [--next:theme(colors.blue.800)] dark:[--current:theme(colors.blue.600)] dark:[--next:theme(colors.blue.800)]">
          <div className="flex items-center justify-between">
            <span>{goal.label}</span>
            <span className="text-sm">{((goal.current / goal.next) * 100).toFixed(2) + '%'}</span>
          </div>
          <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-[--next] p-0.5">
            <div
              style={{ width: Math.floor((goal.current / goal.next) * 100).toFixed(2) + '%' }}
              className="h-full rounded-full bg-[--current]"
            ></div>
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center justify-center gap-2 px-1">
              <div className="h-2 w-2 rounded-full bg-[--current]"></div>
              {match(goal.type, {
                number: () => <>{goal.current}</>,
                money: () => <Money amount={goal.current} />,
              })}
            </div>
            <div className="flex items-center justify-center gap-2 px-1">
              <div className="h-2 w-2 rounded-full bg-[--next]"></div>
              {match(goal.type, {
                number: () => <>{goal.next}</>,
                money: () => <Money amount={goal.next} />,
              })}
            </div>
          </div>
          <div className="mt-4 text-xs">
            Remaining:{' '}
            {match(goal.type, {
              number: () => <>{goal.next - goal.current}</>,
              money: () => <Money amount={goal.next - goal.current} />,
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function ComparisonChart({
  className,
  currentRange,
  previousRecords,
  currentRecords,
  previous,
  next,
}: {
  className?: string
  currentRange: { start: Date; end: Date }
  previousRecords: Record[]
  currentRecords: Record[]
  previous: (value: Date) => Date
  next: (value: Date) => Date
}) {
  let shortCurrencyFormatter = useCurrencyFormatter({ type: 'short' })
  let isClassified = useIsClassified()

  let days = differenceInDays(currentRange.end, currentRange.start)

  // Determine the interval to use for the chart.
  let interval = (() => {
    // If the range is less than a day, use hours.
    if (days <= 1) return 'hour' as const

    // If the range is less than a month, use days.
    if (days <= 30) return 'day' as const

    // If the range is less than a quarter, use weeks.
    if (days <= 92) return 'week' as const

    // If the range is less than a year, use months.
    if (days <= 365) return 'month' as const

    // If the range is less than 5 years, use quarters.
    if (days <= 5 * 365.25) return 'quarter' as const

    // If the range is bigger, use months.
    return 'year' as const
  })()

  let data = match(interval, {
    hour: () => {
      return eachHourOfInterval(currentRange).map((start) => ({
        start,
        end: endOfHour(start),
      }))
    },
    day: () => {
      return eachDayOfInterval(currentRange).map((start) => ({
        start,
        end: endOfDay(start),
      }))
    },
    week: () => {
      return eachWeekOfInterval(currentRange, { weekStartsOn: 1 }).map((start) => ({
        start,
        end: endOfWeek(start, { weekStartsOn: 1 }),
      }))
    },
    month: () => {
      return eachMonthOfInterval(currentRange).map((start) => ({
        start,
        end: endOfMonth(start),
      }))
    },
    quarter: () => {
      return eachQuarterOfInterval(currentRange).map((start) => ({
        start,
        end: endOfQuarter(start),
      }))
    },
    year: () => {
      return eachYearOfInterval(currentRange).map((start) => ({
        start,
        end: endOfYear(start),
      }))
    },
  }).map((range) => ({
    range,
    previous: null as number | null,
    current: null as number | null,
  }))

  for (let [period, records] of [
    ['previous', previousRecords],
    ['current', currentRecords],
  ] as const) {
    next: for (let record of records) {
      if (!isPaidRecord(record)) continue

      let date = resolveRelevantRecordDate(record)
      if (period === 'previous') {
        date = next(date)
      }

      for (let datum of data) {
        if (isWithinInterval(date, datum.range)) {
          datum[period] = (datum[period] ?? 0) + total(record)
          continue next
        }
      }
    }
  }

  // Remove leading and trailing null-data
  {
    let toRemove = []

    // Collect leading null-data
    for (let obj of data) {
      if (obj.previous === null && obj.current === null) {
        toRemove.push(obj)
      } else {
        break
      }
    }

    // Collect trailing null-data
    for (let obj of data.slice().reverse()) {
      if (obj.previous === null && obj.current === null) {
        toRemove.push(obj)
      } else {
        break
      }
    }

    // Actually drop the items
    for (let obj of toRemove) {
      data.splice(data.indexOf(obj), 1)
    }
  }

  let hasData = data.length > 1

  return (
    <div
      className={classNames(
        'flex h-full flex-1 flex-col overflow-auto rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-zinc-900',
        !hasData && 'opacity-50 transition-opacity duration-300 hover:opacity-100',
        className,
      )}
    >
      <div className="border-b p-4 dark:border-zinc-700/75 dark:text-zinc-400">
        Paid invoices compared to previous period
      </div>
      {hasData ? (
        <div className="flex min-h-[theme(spacing.96)] flex-1 gap-4 overflow-x-auto [--current:theme(colors.blue.500)] [--dot-fill:theme(colors.white)] [--grid-color:theme(colors.zinc.200)] [--previous:theme(colors.zinc.400/.50)] dark:[--dot-fill:theme(colors.zinc.950)] dark:[--grid-color:theme(colors.zinc.900)]">
          <div className="h-full w-full flex-1 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 15, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
                <Tooltip
                  content={({ payload = [] }) => (
                    <div className="flex flex-col gap-4 rounded-md bg-white p-4 shadow ring-1 ring-black/10 dark:bg-zinc-900/75">
                      {payload.map((entry, index) => {
                        return (
                          <div key={`item-${index}`} className="flex flex-col gap-2">
                            <div className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                              {match(entry.dataKey as 'previous' | 'current', {
                                previous: () => {
                                  return (
                                    <FormatRange
                                      start={previous(entry.payload.range.start)}
                                      end={previous(entry.payload.range.end)}
                                    />
                                  )
                                },
                                current: () => {
                                  return (
                                    <FormatRange
                                      start={entry.payload.range.start}
                                      end={entry.payload.range.end}
                                    />
                                  )
                                },
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm font-medium text-gray-400 dark:text-zinc-400">
                                <Money amount={Number(entry.value)} />
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                />
                <Legend
                  content={({ payload = [] }) => (
                    <div className="mt-4 flex items-center justify-end gap-8">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm font-medium text-gray-400 dark:text-zinc-400">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <YAxis
                  tickFormatter={(x) =>
                    isClassified ? 'XXX' : shortCurrencyFormatter.format(x / 100)
                  }
                />
                <XAxis
                  tickMargin={16}
                  tickFormatter={(idx) => {
                    let { start, end } = data[idx].range
                    return match(interval, {
                      hour: () => format(start, 'p'),
                      day: () => format(start, 'dd MMM'),
                      week: () => {
                        if (isSameWeek(start, end)) return format(start, 'dd')
                        if (isSameMonth(start, end))
                          return `${format(start, 'dd')} — ${format(end, 'dd MMM')}`
                        return `${format(start, 'dd MMM')} — ${format(end, 'dd MMM')}`
                      },
                      month: () => format(start, 'LLL'),
                      quarter: () => format(start, 'qqq yyyy'),
                      year: () => format(start, 'yyyy'),
                    })
                  }}
                />
                <Line
                  dot={false}
                  type="monotone"
                  name="Previous"
                  dataKey="previous"
                  stroke="var(--previous)"
                  fill="var(--dot-fill)"
                  connectNulls
                />
                <Line
                  dot={false}
                  type="monotone"
                  name="Current"
                  dataKey="current"
                  stroke="var(--current)"
                  fill="var(--dot-fill)"
                  strokeWidth={2}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <Empty message="No data available" />
      )}
    </div>
  )
}

let CompareConfigContext = createContext<{
  withDiff: boolean
  previous: Record[]
  current: Record[]
}>({ withDiff: true, previous: [], current: [] })

function CompareGroup({
  className,
  horizontalCount,
  ...rest
}: React.PropsWithChildren<{ className?: string; horizontalCount: number }>) {
  return (
    <div
      data-grouped={true}
      style={
        {
          '--horizontal-count': horizontalCount,
        } as React.CSSProperties
      }
      className={classNames(
        'group grid grid-cols-[repeat(var(--horizontal-count),minmax(0,1fr))] gap-[calc(var(--gap)/2)] rounded-xl bg-white p-2 shadow ring-1 ring-black/5 dark:bg-zinc-900 first:[&>*]:col-[span_calc(var(--horizontal-count)-1)/_span_calc(var(--horizontal-count)-1)] first:[&>*]:row-span-2',
        className,
      )}
      {...rest}
    />
  )
}

function CompareBlock<T = Record[]>({
  title,
  value,
  data = (i) => i as T,
  display = (i) => <>{i}</>,
  footer = null,
  inverse = false,
  variant = 'normal',
  className,
}: {
  title: string
  data?: (values: Record[]) => T
  value: (data: T) => number | null
  display?: (value: number) => React.ReactNode
  footer?: ((data: T) => React.ReactNode) | null
  inverse?: boolean
  variant?: 'tiny' | 'normal'
  className?: string
}) {
  let { withDiff, previous, current } = useContext(CompareConfigContext)
  let previousValue = value(data(previous))
  let currentData = data(current)
  let currentValue = value(currentData)

  let showDiff = withDiff && previousValue !== null && currentValue !== null

  return (
    <div
      className={classNames(
        'relative flex flex-col gap-2 rounded-md shadow ring-1 ring-black/5 group-data-[grouped]:shadow-none group-data-[grouped]:ring-0',
        match(variant, {
          tiny: () => 'bg-gray-100 p-2 dark:bg-zinc-800',
          normal: () => 'bg-white p-4 dark:bg-zinc-900',
        }),
        currentValue === null && 'opacity-50 transition-opacity duration-300 hover:opacity-100',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-2">
        <span
          title={title}
          className={classNames(
            'truncate text-gray-600 dark:text-zinc-400',
            match(variant, {
              tiny: () => 'text-xs',
              normal: () => 'text-sm',
            }),
          )}
        >
          {title}
        </span>
        <div className="flex flex-1 flex-wrap items-baseline gap-2">
          <span
            className={classNames(
              'font-semibold tabular-nums text-zinc-500 dark:text-zinc-400',
              match(variant, {
                tiny: () => 'text-base',
                normal: () => 'text-2xl',
              }),
            )}
          >
            {currentValue === null ? 'N/A' : display(currentValue)}
          </span>
          {showDiff && (
            <span
              className={classNames(
                '-translate-y-0.5',
                match(variant, {
                  tiny: () => 'text-xs [--icon-size:theme(spacing.3)]',
                  normal: () => 'text-sm [--icon-size:theme(spacing.5)]',
                }),
              )}
            >
              {match(Math.sign(currentValue! - previousValue!), {
                [1]: () => (
                  <span
                    className={classNames(
                      'flex items-baseline font-semibold',
                      inverse
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400',
                    )}
                  >
                    <ArrowUpIcon
                      className={classNames(
                        'h-[--icon-size] w-[--icon-size] shrink-0 self-center',
                        inverse
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-green-500 dark:text-green-400',
                      )}
                    />
                    {display(currentValue! - previousValue!)}
                  </span>
                ),
                [0]: () => null,
                [-1]: () => (
                  <span
                    className={classNames(
                      'flex items-baseline font-semibold',
                      inverse
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    <ArrowDownIcon
                      className={classNames(
                        'h-[--icon-size] w-[--icon-size] shrink-0 self-center',
                        inverse
                          ? 'text-green-500 dark:text-green-400'
                          : 'text-red-500 dark:text-red-400',
                      )}
                    />
                    {display(currentValue! - previousValue!)}
                  </span>
                ),
              })}
            </span>
          )}
        </div>
        {footer && currentData && footer(currentData)}
      </div>
    </div>
  )
}

function AccumulativePaidInvoicesChartCell({ className }: { className?: string }) {
  let data = useDashboardData()

  return (
    <AccumulativePaidInvoicesChart
      className={className}
      currentRange={data.currentRange}
      currentRecords={data.current}
    />
  )
}

function AccumulativePaidInvoicesChart({
  className,
  currentRange,
  currentRecords,
}: {
  className?: string
  currentRange: { start: Date; end: Date }
  currentRecords: Record[]
}) {
  let shortCurrencyFormatter = useCurrencyFormatter({ type: 'short' })
  let isClassified = useIsClassified()

  let data = eachDayOfInterval(currentRange).map((start) => ({
    start,
    end: endOfDay(start),
    total: 0,
  }))

  let accumulator = 0
  for (let record of currentRecords
    .slice()
    .sort((a, z) => compareAsc(resolveRelevantRecordDate(a), resolveRelevantRecordDate(z)))) {
    if (!isPaidRecord(record)) continue

    let date = resolveRelevantRecordDate(record)
    if (isWithinInterval(date, currentRange)) {
      let datum = data.find((d) => isWithinInterval(date, d))
      if (!datum) continue
      accumulator += total(record)
      datum.total = accumulator
    }
  }

  data = data.filter((d) => d.total !== 0)

  let hasData = data.length > 1

  return (
    <div
      className={classNames(
        'flex h-full flex-1 flex-col overflow-auto rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-zinc-900',
        !hasData && 'opacity-50 transition-opacity duration-300 hover:opacity-100',
        className,
      )}
    >
      <div className="border-b p-4 dark:border-zinc-700/75 dark:text-zinc-400">
        Accumulative paid invoices
      </div>
      {hasData ? (
        <div className="flex min-h-[theme(spacing.96)] flex-1 gap-4 overflow-x-auto [--current:theme(colors.blue.500)] [--dot-fill:theme(colors.white)] [--grid-color:theme(colors.zinc.200)] [--previous:theme(colors.zinc.400/.50)] dark:[--dot-fill:theme(colors.zinc.950)] dark:[--grid-color:theme(colors.zinc.900)]">
          <div className="h-full w-full flex-1 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 15, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
                <Tooltip
                  content={({ payload = [] }) => (
                    <div className="flex flex-col gap-2 rounded-md bg-white p-4 shadow ring-1 ring-black/10 dark:bg-zinc-900/75">
                      {payload.map((entry, index) => {
                        return (
                          <Fragment key={`item-${index}`}>
                            {index === 0 && (
                              <div className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                                <FormatRange start={entry.payload.start} end={entry.payload.end} />
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm font-medium text-gray-400 dark:text-zinc-400">
                                <Money amount={Number(entry.value)} />
                              </span>
                            </div>
                          </Fragment>
                        )
                      })}
                    </div>
                  )}
                />
                <Legend
                  content={({ payload = [] }) => (
                    <div className="mt-4 flex items-center justify-end gap-8">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm font-medium text-gray-400 dark:text-zinc-400">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <YAxis
                  tickFormatter={(x) =>
                    isClassified ? 'XXX' : shortCurrencyFormatter.format(x / 100)
                  }
                />
                <XAxis
                  tickMargin={16}
                  tickFormatter={(idx) => {
                    let { start } = data[idx]
                    return format(start, 'dd MMM')
                  }}
                />
                <Line
                  dot={false}
                  type="basis"
                  name="Total"
                  dataKey="total"
                  stroke="var(--current)"
                  fill="var(--dot-fill)"
                  strokeWidth={2}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <Empty message="No data available" />
      )}
    </div>
  )
}

// ---

type Goal = {
  current: number
  next: number
  label: string
  type: 'number' | 'money'
}

function createGoals(records: Record[], milestones: Milestones): Goal[] {
  let goals: Goal[] = []

  let paidRecords = records.filter(isPaidRecord)

  // Paid invoices count
  {
    let current = paidRecords.length
    let next = milestones.invoiceCountMilestonesData.findLast((m) => m > current)
    if (next) {
      goals.push({ current, next, label: 'Paid invoices', type: 'number' })
    }
  }

  // Client count
  {
    let current = new Set(paidRecords.map((r) => r.client.id)).size
    let next = milestones.clientCountMilestonesData.findLast((m) => m > current)
    if (next) {
      goals.push({ current, next, label: 'Total clients', type: 'number' })
    }
  }

  // International client count
  {
    let current = new Set(
      paidRecords
        .filter((r) => r.client.billing.country !== r.account.billing.country)
        .map((r) => r.client.id),
    ).size
    let next = milestones.internationalClientCountMilestonesData.findLast((m) => m > current)
    if (next) {
      goals.push({ current, next, label: 'Total international clients', type: 'number' })
    }
  }

  // Total revenue
  {
    let current = paidRecords.reduce((sum, r) => sum + total(r), 0)
    let next = milestones.revenueMilestonesData.findLast((m) => m > current)
    if (next) {
      goals.push({ current, next, label: 'Total revenue', type: 'money' })
    }
  }

  return (
    goals
      // Filter out goals with 0%
      .filter((g) => g.current / g.next !== 0)

      // Sort goals by progress
      .sort((a, z) => z.current / z.next - a.current / a.next)
  )
}
