'use client'

import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { ArrowSmallLeftIcon, ArrowSmallRightIcon } from '@heroicons/react/24/outline'
import {
  addMinutes,
  compareAsc,
  differenceInDays,
  differenceInMinutes,
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
} from 'date-fns'
import Link from 'next/link'
import { Fragment, createContext, useContext, useMemo, useState } from 'react'
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
import {
  isAccepted,
  isActiveRecord,
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
import { classNames } from '~/ui/class-names'
import { FormatRange } from '~/ui/date-range'
import { Empty } from '~/ui/empty'
import { useCurrencyFormatter } from '~/ui/hooks/use-currency-formatter'
import { useCurrentDate } from '~/ui/hooks/use-current-date'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { total, totalUnpaid } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { RangePicker, options } from '~/ui/range-picker'
import { TinyRecord } from '~/ui/record/tiny-record'
import { match } from '~/utils/match'

export function Dashboard({ me, records }: { me: Account; records: Record[] }) {
  let [, defaultRange, defaultPrevious, defaultNext] = options.find((e) => e[0] === 'This quarter')!

  let now = useCurrentDate()

  let [earliestDate = now, latestDate = now] = useMemo(() => {
    if (records.length <= 0) return [undefined, undefined]

    let sortedRecords = records
      .slice()
      .sort((a, z) => compareAsc(resolveRelevantRecordDate(a), resolveRelevantRecordDate(z)))

    let earliest = sortedRecords[0]
    let latest = sortedRecords[sortedRecords.length - 1]

    return [resolveRelevantRecordDate(earliest), resolveRelevantRecordDate(latest)]
  }, [records])

  let [[start, end], setRange] = useState(() => {
    let [start, end] = defaultRange(now)
    return [start ?? earliestDate, end ?? latestDate]
  })

  let [previous, setPrevious] = useState(() => defaultPrevious)
  let [next, setNext] = useState(() => defaultNext)

  let previousRange = {
    start: previous(start, [start, end]),
    end: previous(end, [start, end]),
  }
  let currentRange = { start, end }

  let previousRecords = records.filter((r) =>
    isWithinInterval(resolveRelevantRecordDate(r), previousRange),
  )
  let currentRecords = records.filter((r) =>
    isWithinInterval(resolveRelevantRecordDate(r), currentRange),
  )

  let allRecords = separateRecords(records)
  let systemContainsQuotes = allRecords.some((r) => isQuote(r))
  let systemContainsInvoices = allRecords.some((r) => isInvoice(r))

  return (
    <CompareConfigContext.Provider
      value={{
        previous: previousRecords,
        current: currentRecords,
        withDiff: isAfter(previousRange.end, earliestDate),
      }}
    >
      <I18NProvider
        value={{
          // Prefer my language/currency when looking at the overview of records.
          language: me.language,
          currency: me.currency,
        }}
      >
        <main className="space-y-[--gap] px-4 py-8 [--gap:theme(spacing.4)] sm:px-6 lg:px-8">
          <div className="sticky top-0 z-10 -mx-2 -mb-[calc(var(--gap)-1px)] -mt-[--gap] flex items-center justify-between bg-gray-100/20 px-2 py-[--gap] backdrop-blur dark:bg-zinc-800/20">
            <div>
              <div className="flex items-center gap-2">
                <button
                  className="aspect-square rounded-md bg-white px-2 py-1.5 text-sm shadow ring-1 ring-black/10 dark:bg-zinc-900/75 dark:text-zinc-300"
                  onClick={() =>
                    setRange(([start, end]) => [
                      previous(start, [start, end]),
                      previous(end, [start, end]),
                    ])
                  }
                >
                  <ArrowSmallLeftIcon className="h-4 w-4" />
                </button>

                <button
                  className="aspect-square rounded-md bg-white px-2 py-1.5 text-sm shadow ring-1 ring-black/10 dark:bg-zinc-900/75 dark:text-zinc-300"
                  onClick={() =>
                    setRange(([start, end]) => [next(start, [start, end]), next(end, [start, end])])
                  }
                >
                  <ArrowSmallRightIcon className="h-4 w-4" />
                </button>

                <RangePicker
                  start={start}
                  end={end}
                  onChange={([x, y], previous, next) => {
                    setRange([x ?? earliestDate, y ?? latestDate])
                    setPrevious(() => previous)
                    setNext(() => next)
                  }}
                />

                <div className="flex items-center gap-2 text-xs dark:text-zinc-400">
                  <span>vs</span>
                  <span className="text-sm dark:text-zinc-300">
                    <FormatRange start={previousRange.start} end={previousRange.end} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={
              {
                '--cols': `repeat(${
                  4 - (systemContainsQuotes ? 0 : 1) - (systemContainsInvoices ? 0 : 1)
                }, minmax(0, 1fr))`,
              } as React.CSSProperties
            }
            className="grid grid-cols-2 gap-[--gap] 2xl:grid-cols-[--cols]"
          >
            {systemContainsQuotes && (
              <CompareGroup>
                <CompareBlock
                  title="Quotes"
                  value={(list) => separateRecords(list).filter((r) => isQuote(r)).length}
                />
                <CompareBlock
                  variant="tiny"
                  title="Draft"
                  value={(list) =>
                    separateRecords(list).filter((r) => isQuote(r) && isDraft(r)).length
                  }
                />
                <CompareBlock
                  variant="tiny"
                  title="Sent"
                  value={(list) =>
                    separateRecords(list).filter((r) => isQuote(r) && isSent(r)).length
                  }
                />
                <CompareBlock
                  variant="tiny"
                  title="Accepted"
                  value={(list) =>
                    separateRecords(list).filter((r) => isQuote(r) && isAccepted(r)).length
                  }
                />
                <CompareBlock
                  variant="tiny"
                  title="Rejected"
                  value={(list) =>
                    separateRecords(list).filter((r) => isQuote(r) && isRejected(r)).length
                  }
                />
                <CompareBlock
                  variant="tiny"
                  title="Expired"
                  value={(list) =>
                    separateRecords(list).filter((r) => isQuote(r) && isExpired(r)).length
                  }
                />
                <CompareBlock
                  variant="tiny"
                  title="Closed"
                  value={(list) =>
                    separateRecords(list).filter((r) => isQuote(r) && isClosed(r)).length
                  }
                />
              </CompareGroup>
            )}

            {systemContainsInvoices && (
              <CompareGroup>
                <CompareBlock
                  title="Invoices"
                  value={(list) => separateRecords(list).filter((r) => isInvoice(r)).length}
                />
                <CompareBlock
                  variant="tiny"
                  title="Draft"
                  value={(list) =>
                    separateRecords(list).filter((r) => isInvoice(r) && isDraft(r)).length
                  }
                />
                <CompareBlock
                  variant="tiny"
                  title="Sent"
                  value={(list) =>
                    separateRecords(list).filter((r) => isInvoice(r) && isSent(r)).length
                  }
                />
                <CompareBlock
                  variant="tiny"
                  title="Paid"
                  value={(list) =>
                    separateRecords(list).filter((r) => isInvoice(r) && isPaid(r)).length
                  }
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
                  value={(list) =>
                    separateRecords(list).filter((r) => isInvoice(r) && isOverdue(r)).length
                  }
                />
                <CompareBlock
                  variant="tiny"
                  title="Closed"
                  value={(list) =>
                    separateRecords(list).filter((r) => isInvoice(r) && isClosed(r)).length
                  }
                />
              </CompareGroup>
            )}

            <div className="col-span-2 grid grid-cols-4 items-stretch gap-[--gap]">
              <CompareBlock
                title="Receipts"
                value={(list) => separateRecords(list).filter((r) => isReceipt(r)).length}
              />

              <CompareBlock
                title="Unique clients"
                value={(list) => new Set(separateRecords(list).map((r) => r.client.id)).size}
              />

              <CompareBlock<readonly [Client | null, number | null]>
                className="col-span-2 row-start-2"
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

                  return [
                    clients.find((c) => c.id === winner) ?? null,
                    byClient.get(winner) ?? null,
                  ] as const
                }}
                value={(data) => data?.[1] ?? null}
                display={(value) => <Money amount={value} />}
                footer={(data) =>
                  data?.[0] && (
                    <div className="text-xs text-gray-500 dark:text-zinc-400">{data[0].name} </div>
                  )
                }
              />

              <CompareBlock
                className="col-span-2"
                inverse
                title="Outstanding"
                value={(list) =>
                  list
                    .filter((e) => isInvoice(e) && (isSent(e) || isPartiallyPaid(e)))
                    .reduce((acc, r) => acc + totalUnpaid(r), 0)
                }
                display={(value) => <Money amount={value} />}
              />

              <CompareBlock
                className="col-span-2"
                title="Paid"
                value={(list) =>
                  list.filter((e) => isPaidRecord(e)).reduce((acc, e) => acc + total(e), 0)
                }
                display={(value) => <Money amount={value} />}
              />
            </div>
          </div>

          {(() => {
            let data = currentRecords.filter((e) => isActiveRecord(e)).reverse()

            return (
              <div
                className={classNames(
                  'flex flex-1 flex-col overflow-auto rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-zinc-900',
                  data.length === 0 &&
                    'opacity-50 transition-opacity duration-300 hover:opacity-100',
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
          })()}

          <div className="grid grid-cols-5 gap-[--gap]">
            <div className="col-span-2 flex flex-1 flex-col gap-[--gap]">
              <div className="grid grid-cols-1 gap-[--gap] xl:grid-cols-2">
                {systemContainsQuotes && (
                  <>
                    <CompareBlock<readonly [Record, number] | null>
                      inverse
                      title={'Fastest accepted quote'}
                      data={(list) =>
                        separateRecords(list)
                          .filter((r) => isQuote(r) && isAccepted(r))
                          .flatMap((r) => {
                            let sentAt = r.events.find((e) => e.type === 'quote-sent')?.at
                            if (!sentAt) return []

                            let paidAt = r.events.find((e) => e.type === 'quote-accepted')?.at
                            if (!paidAt) return []

                            return [[r, differenceInMinutes(paidAt, sentAt)] as const]
                          })
                          .sort(([, a], [, z]) => z - a)
                          .pop() ?? null
                      }
                      value={(data) => data?.[1] ?? null}
                      display={(value) => (
                        <span>{formatDistanceStrict(now, addMinutes(now, value))}</span>
                      )}
                      footer={(data) =>
                        data && (
                          <div className="text-xs text-gray-500 dark:text-zinc-400">
                            <Link href={`/${data[0].type}/${data[0].number}`}>
                              <span className="absolute inset-0"></span>
                              {data[0].client.name}{' '}
                              <small className="tabular-nums">— {data[0].number}</small>
                            </Link>
                          </div>
                        )
                      }
                    />

                    <CompareBlock<readonly [Record, number] | null>
                      inverse
                      title={'Slowest accepted quote'}
                      data={(list) =>
                        separateRecords(list)
                          .filter((r) => isQuote(r) && isAccepted(r))
                          .flatMap((r) => {
                            let sentAt = r.events.find((e) => e.type === 'quote-sent')?.at
                            if (!sentAt) return []

                            let paidAt = r.events.find((e) => e.type === 'quote-accepted')?.at
                            if (!paidAt) return []

                            return [[r, differenceInMinutes(paidAt, sentAt)] as const]
                          })
                          .sort(([, a], [, z]) => a - z)
                          .pop() ?? null
                      }
                      value={(data) => data?.[1] ?? null}
                      display={(value) => (
                        <span>{formatDistanceStrict(now, addMinutes(now, value))}</span>
                      )}
                      footer={(data) =>
                        data && (
                          <div className="text-xs text-gray-500 dark:text-zinc-400">
                            <Link href={`/${data[0].type}/${data[0].number}`}>
                              <span className="absolute inset-0"></span>
                              {data[0].client.name}{' '}
                              <small className="tabular-nums">— {data[0].number}</small>
                            </Link>
                          </div>
                        )
                      }
                    />
                  </>
                )}

                <CompareBlock<readonly [Record, number] | null>
                  inverse
                  title={'Fastest paying client'}
                  data={(list) =>
                    separateRecords(list)
                      .filter((r) => isPaidRecord(r))
                      .map((r) => (isReceipt(r) ? r.invoice : r))
                      .flatMap((r) => {
                        let sentAt = r.events.find((e) => e.type === 'invoice-sent')?.at
                        if (!sentAt) return []

                        let paidAt = r.events.find((e) => e.type === 'invoice-paid')?.at
                        if (!paidAt) return []

                        return [[r, differenceInMinutes(paidAt, sentAt)] as const]
                      })
                      .sort(([, a], [, z]) => z - a)
                      .pop() ?? null
                  }
                  value={(data) => data?.[1] ?? null}
                  display={(value) => (
                    <span>{formatDistanceStrict(now, addMinutes(now, value))}</span>
                  )}
                  footer={(data) =>
                    data && (
                      <div className="text-xs text-gray-500 dark:text-zinc-400">
                        <Link href={`/${data[0].type}/${data[0].number}`}>
                          <span className="absolute inset-0"></span>
                          {data[0].client.name}{' '}
                          <small className="tabular-nums">— {data[0].number}</small>
                        </Link>
                      </div>
                    )
                  }
                />

                <CompareBlock<readonly [Record, number] | null>
                  inverse
                  title={'Slowest paying client'}
                  data={(list) =>
                    separateRecords(list)
                      .filter((e) => isPaidRecord(e))
                      .map((r) => (isReceipt(r) ? r.invoice : r))
                      .flatMap((e) => {
                        let sentAt = e.events.find((e) => e.type === 'invoice-sent')?.at
                        if (!sentAt) return []

                        let paidAt = e.events.find((e) => e.type === 'invoice-paid')?.at
                        if (!paidAt) return []

                        return [[e, differenceInMinutes(paidAt, sentAt)] as const]
                      })
                      .sort(([, a], [, z]) => a - z)
                      .pop() ?? null
                  }
                  value={(data) => data?.[1] ?? null}
                  display={(value) => (
                    <span>{formatDistanceStrict(now, addMinutes(now, value))}</span>
                  )}
                  footer={(data) =>
                    data && (
                      <div className="text-xs text-gray-500 dark:text-zinc-400">
                        <Link href={`/${data[0].type}/${data[0].number}`}>
                          <span className="absolute inset-0"></span>
                          {data[0].client.name}{' '}
                          <small className="tabular-nums">— {data[0].number}</small>
                        </Link>
                      </div>
                    )
                  }
                />
              </div>

              {(() => {
                let totalInvoiceSales = currentRecords
                  .filter((e) => isPaidRecord(e))
                  .reduce((acc, e) => acc + total(e), 0)

                let data = Array.from(
                  currentRecords
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
                      data.length === 0 &&
                        'opacity-50 transition-opacity duration-300 hover:opacity-100',
                    )}
                  >
                    <div className="border-b p-4 dark:border-zinc-700/75 dark:text-zinc-400">
                      Top paying clients
                    </div>
                    {data.length > 0 ? (
                      <div className="flex-1 divide-y divide-gray-100 dark:divide-zinc-900">
                        {data.map(([id, { client, total }], idx) => (
                          <I18NProvider key={id} value={client}>
                            <div className="group relative flex items-center p-3 first:border-t-[1px] first:border-t-transparent focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:border-zinc-700">
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
                                  <span className="truncate">{client.name}</span>
                                  <span className="text-xs">
                                    <Money amount={total} />
                                    <small className="mx-1 inline-block w-[4ch] flex-shrink-0 text-right">
                                      {((total / totalInvoiceSales) * 100).toFixed(0)}%
                                    </small>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </I18NProvider>
                        ))}
                      </div>
                    ) : (
                      <Empty message="No clients available" />
                    )}
                  </div>
                )
              })()}
            </div>

            <div className="col-span-3">
              <ComparisonChart
                currentRange={currentRange}
                previousRecords={previousRecords}
                currentRecords={currentRecords}
                next={next}
              />
            </div>
          </div>
        </main>
      </I18NProvider>
    </CompareConfigContext.Provider>
  )
}

function ComparisonChart({
  currentRange,
  previousRecords,
  currentRecords,
  next,
}: {
  currentRange: { start: Date; end: Date }
  previousRecords: Record[]
  currentRecords: Record[]
  next: (value: Date, range: [start: Date, end: Date]) => Date
}) {
  let currencyFormatter = useCurrencyFormatter()
  let shortCurrencyFormatter = useCurrencyFormatter({ type: 'short' })

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
        date = next(date, [currentRange.start, currentRange.end])
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
                    <div className="flex flex-col gap-2 rounded-md bg-white p-4 shadow ring-1 ring-black/10 dark:bg-zinc-900/75">
                      {payload.map((entry, index) => {
                        return (
                          <Fragment key={`item-${index}`}>
                            {index === 0 && (
                              <div className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                                <FormatRange
                                  start={entry.payload.range.start}
                                  end={entry.payload.range.end}
                                />
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
                  tickFormatter={(x) => {
                    if (x >= 100_000) {
                      return `${shortCurrencyFormatter.format(x / 100_000)}k`
                    }
                    return currencyFormatter.format(x / 100)
                  }}
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
                  type="natural"
                  name="Previous"
                  dataKey="previous"
                  stroke="var(--previous)"
                  fill="var(--dot-fill)"
                  connectNulls
                />
                <Line
                  type="natural"
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

function CompareGroup(props: React.PropsWithChildren<{}>) {
  return (
    <div
      data-grouped={true}
      className="group grid grid-cols-4 gap-[calc(var(--gap)/2)] rounded-xl bg-white p-2 shadow ring-1 ring-black/5 dark:bg-zinc-900 first:[&>*]:col-span-3 first:[&>*]:row-span-2"
      {...props}
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
