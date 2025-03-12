'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import {
  CalendarIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline'
import { compareDesc, format } from 'date-fns'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Fragment, type ReactNode } from 'react'
import { CreditNote } from '~/domain/credit-note/credit-note'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { recordHasAttachments } from '~/domain/record/filters'
import { resolveRelevantRecordDate, type Record } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { DownloadLink } from '~/ui/download-link'
import { Empty } from '~/ui/empty'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { StatusDisplay as InvoiceStatusDisplay } from '~/ui/invoice/status'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { StatusDisplay as QuoteStatusDisplay } from '~/ui/quote/status'
import { TotalsByStatus } from '~/ui/record/totals-by-status'
import { DefaultMap } from '~/utils/default-map'
import { match } from '~/utils/match'
import { useRecordStacks } from '../hooks/use-record-stacks'

function titleForQuarter(date: Date, separator = ' • ') {
  return [format(date, 'QQQ'), format(date, 'y')].join(separator)
}

function groupRecords(records: Record[]) {
  return Array.from(
    records
      .sort((a, z) => {
        return (
          compareDesc(resolveRelevantRecordDate(a), resolveRelevantRecordDate(z)) ||
          z.number.localeCompare(a.number)
        )
      })

      // Group by quarter & year
      .reduce(
        (acc, record) => {
          let [year, key] = match(
            record.type,
            {
              quote: (r: Quote) => {
                return [format(r.quoteDate, 'y'), titleForQuarter(r.quoteDate)] as const
              },
              invoice: (r: Invoice) => {
                return [format(r.issueDate, 'y'), titleForQuarter(r.issueDate)] as const
              },
              'credit-note': (r: CreditNote) => {
                return [format(r.creditNoteDate, 'y'), titleForQuarter(r.creditNoteDate)] as const
              },
              receipt: (r: Receipt) => {
                return [format(r.receiptDate, 'y'), titleForQuarter(r.receiptDate)] as const
              },
            },
            record,
          )

          acc.get(year).get(key).push(record)

          return acc
        },
        new DefaultMap(() => {
          return new DefaultMap(() => {
            return [] as Record[]
          })
        }),
      ),
  )
}

export function RecordList({ records }: { records: Record[] }) {
  let currentYear = format(new Date(), 'y')
  let currentQuarter = titleForQuarter(new Date())
  let params = useParams()
  let type = params.type
  let stacks = useRecordStacks()

  if (records.length <= 0) {
    return (
      <div className="p-2">
        <Empty message="No records yet" />
      </div>
    )
  }

  return (
    <div className="[--indent:theme(spacing.4)] [--level:45px] dark:text-white">
      <div className="relative flex justify-between px-4 py-2 text-gray-500 dark:text-gray-400">
        <div>
          <span className="capitalize">{type ?? 'all'}</span> records
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] p-[var(--indent)]">
        {groupRecords(records).map(([year, records]) => {
          // Right now, the only actions available are for Belgian accounts to
          // export a client listing.
          let hasActions = Array.from(records.values())
            .flat(1)
            .some((record) => /^be/i.test(record.account.tax?.value ?? ''))

          return (
            <Fragment key={year}>
              <div
                className={classNames(
                  'sticky top-[calc(var(--level)*0)] isolate z-10 col-span-full -mx-[var(--indent)] grid gap-2 border-t border-gray-950/5 bg-gray-200 px-[calc(theme(spacing.4)+var(--indent))] py-2 dark:border-gray-100/10 dark:bg-zinc-900',
                  hasActions ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]',
                )}
              >
                <div>{year}</div>
                <TotalsByStatus records={Array.from(records.values()).flat(1)} />
                {hasActions && (
                  <Menu as="div" className="inline-flex items-center text-left">
                    <MenuButton
                      aria-label="Open actions"
                      className="inline-flex w-full select-none justify-center gap-x-1.5 rounded-md bg-white p-1 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-950"
                    >
                      <EllipsisVerticalIcon aria-hidden="true" className="h-5 w-5" />
                    </MenuButton>

                    <MenuItems
                      transition
                      anchor="bottom end"
                      className="z-10 w-56 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition [--anchor-gap:theme(spacing.1)] [--anchor-offset:theme(spacing.1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in dark:bg-zinc-900 dark:ring-white/10"
                    >
                      <div className="py-1">
                        <MenuItem>
                          <DownloadLink
                            href={`/clients/listing/${year}/download`}
                            className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 dark:text-zinc-400 data-[focus]:dark:bg-zinc-950 data-[focus]:dark:text-gray-200"
                          >
                            Download client listing
                          </DownloadLink>
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Menu>
                )}
              </div>
              {Array.from(records.entries()).map(([title, records]) => {
                // let future = records.every((e) => {
                //   return isFuture(resolveRelevantRecordDate(e))
                // })

                return (
                  <Fragment key={title}>
                    <div className="sticky top-[calc(var(--level)*1)] isolate z-10 col-span-full -mx-[var(--indent)] grid grid-cols-[1fr_auto_auto] gap-2 border-t border-gray-950/5 bg-gray-200 px-[calc(theme(spacing.4)+var(--indent))] py-2 dark:border-gray-100/10 dark:bg-zinc-900">
                      <span>{title}</span>
                      <TotalsByStatus records={records} />
                      <Menu as="div" className="inline-flex items-center text-left">
                        <MenuButton
                          aria-label="Open actions"
                          className="inline-flex w-full select-none justify-center gap-x-1.5 rounded-md bg-white p-1 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-950"
                        >
                          <EllipsisVerticalIcon aria-hidden="true" className="h-5 w-5" />
                        </MenuButton>

                        <MenuItems
                          transition
                          anchor="bottom end"
                          className="z-10 w-56 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition [--anchor-gap:theme(spacing.1)] [--anchor-offset:theme(spacing.1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in dark:bg-zinc-900 dark:ring-white/10"
                        >
                          <div className="py-1">
                            <MenuItem>
                              <DownloadLink
                                href={`${type ?? 'all'}/download?${new URLSearchParams({
                                  ids: records.map((e) => e.id).join(','),
                                  filename: type
                                    ? `${type}s-${titleForQuarter(resolveRelevantRecordDate(records[0]), '-')}`
                                    : `${titleForQuarter(resolveRelevantRecordDate(records[0]), '-')}`,
                                })}`}
                                className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 dark:text-zinc-400 data-[focus]:dark:bg-zinc-950 data-[focus]:dark:text-gray-200"
                              >
                                Download
                              </DownloadLink>
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Menu>
                    </div>

                    <TableHeader />

                    {/* Spacer */}
                    <div className="h-4" />

                    {records.map((record, idx, all) => {
                      let isLayered = (stacks[record.id]?.length ?? 0) > 1
                      let hasAttachments = recordHasAttachments(record, 'any')

                      return (
                        <I18NProvider
                          key={record.id}
                          value={{
                            // Prefer the language of the account when looking at the overview of
                            // records.
                            language: record.account.language,

                            // Prefer the currency of the client when looking at the overview of
                            // records.
                            currency: record.client.currency,
                          }}
                        >
                          <Link
                            href={`/${record.type}/${record.number}`}
                            className={classNames(
                              'group/row relative isolate',
                              'col-span-full grid grid-cols-subgrid',
                              'divide-x divide-gray-950/5 dark:divide-gray-100/10',
                              // idx === 0 && '*:pt-4',
                              // all.length - 1 === idx && '*:pb-12',
                            )}
                          >
                            <Cell>
                              <span className="flex flex-col whitespace-nowrap">
                                <span>
                                  {match(record.type, {
                                    quote: () => 'Quote',
                                    invoice: () => 'Invoice',
                                    'credit-note': () => 'Credit note',
                                    receipt: () => 'Receipt',
                                  })}
                                </span>
                                <span className="text-xs">#{record.number}</span>
                              </span>
                            </Cell>
                            <Cell>{record.client.nickname}</Cell>
                            <Cell align="center">
                              <span className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-300">
                                <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-white" />
                                <span>
                                  {format(
                                    match(
                                      record.type,
                                      {
                                        quote: (r: Quote) => r.quoteDate,
                                        invoice: (r: Invoice) => r.issueDate,
                                        'credit-note': (r: CreditNote) => r.creditNoteDate,
                                        receipt: (r: Receipt) => r.receiptDate,
                                      },
                                      record,
                                    ),
                                    'PP',
                                  )}
                                </span>
                              </span>
                            </Cell>
                            <Cell align="center">
                              <span className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-300">
                                <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-white" />
                                <span>
                                  {format(
                                    match(
                                      record.type,
                                      {
                                        quote: (r: Quote) => r.quoteExpirationDate,
                                        invoice: (r: Invoice) => r.dueDate,
                                        'credit-note': (r: CreditNote) => r.creditNoteDate,
                                        receipt: (r: Receipt) => r.receiptDate,
                                      },
                                      record,
                                    ),
                                    'PP',
                                  )}
                                </span>
                              </span>
                            </Cell>
                            <Cell align="center">
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
                            </Cell>
                            <Cell align="right">
                              <Money amount={total(record)} />
                            </Cell>
                            <Cell>
                              <div className="flex gap-2">
                                {hasAttachments && (
                                  <div
                                    title="Contains attachments"
                                    className="rounded-md bg-black/5 p-2"
                                  >
                                    <PaperClipIcon className="h-5 w-5" />
                                  </div>
                                )}
                                {isLayered && (
                                  <div
                                    title="Contains related documents"
                                    className="rounded-md bg-black/5 p-2"
                                  >
                                    <RectangleStackIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                            </Cell>

                            {/* Hover element: */}
                            <div className="pointer-events-none absolute inset-0 isolate rounded-md !bg-black/5 opacity-0 ring-2 ring-inset ring-black/5 transition-opacity duration-100 ease-in-out group-hover/row:opacity-100" />
                          </Link>
                        </I18NProvider>
                      )
                    })}

                    {/* Spacer */}
                    <div className="h-12" />
                  </Fragment>
                )
              })}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

function TableHeader() {
  return (
    <div className="sticky top-[calc(var(--level)*2)] isolate z-10 col-span-full grid grid-cols-subgrid divide-x divide-gray-950/5 border-b border-gray-950/5 dark:divide-gray-100/10 dark:border-gray-100/10">
      <TableHeaderCell className="justify-start">#</TableHeaderCell>
      <TableHeaderCell className="justify-center">Client</TableHeaderCell>
      <TableHeaderCell className="justify-center">Issue date</TableHeaderCell>
      <TableHeaderCell className="justify-center">Due date</TableHeaderCell>
      <TableHeaderCell className="justify-center">Status</TableHeaderCell>
      <TableHeaderCell className="justify-end">Total</TableHeaderCell>
      <TableHeaderCell className="justify-end"></TableHeaderCell>
    </div>
  )
}

function TableHeaderCell({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={classNames(
        'flex items-center bg-gray-200 px-4 py-2 text-sm dark:bg-zinc-800',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Cell({
  children,
  align = 'left',
}: {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
}) {
  return (
    <div
      className={classNames(
        'px-4 py-2',
        'flex items-center',
        // 'm-1 bg-black',
        align === 'left' && 'justify-start text-left',
        align === 'center' && 'justify-center text-center',
        align === 'right' && 'justify-end text-right',
      )}
    >
      {children}
    </div>
  )
}
