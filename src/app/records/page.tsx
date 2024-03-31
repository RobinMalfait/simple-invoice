import { compareDesc, format, isFuture } from 'date-fns'
import Link from 'next/link'

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { me, records } from '~/data'
import { CreditNote } from '~/domain/credit-note/credit-note'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { combineRecords, resolveRelevantRecordDate, type Record } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { Empty } from '~/ui/empty'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TinyRecord } from '~/ui/record/tiny-record'
import { TotalsByStatus } from '~/ui/record/totals-by-status'
import { DefaultMap } from '~/utils/default-map'
import { match } from '~/utils/match'

function titleForQuarter(date: Date) {
  return [format(date, 'QQQ'), format(date, 'y')].join(' • ')
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

export default async function Home() {
  let combinedRecords = combineRecords(records)

  let currentYear = format(new Date(), 'y')
  let currentQuarter = titleForQuarter(new Date())

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of records.
        language: me.language,
        currency: me.currency,
      }}
    >
      <div>
        {combinedRecords.length > 0 ? (
          <>
            {groupRecords(combinedRecords).map(([year, records]) => {
              return (
                <Disclosure key={year} defaultOpen={true} as="div">
                  <div className="relative flex w-full flex-col">
                    <DisclosureButton className="sticky top-4 isolate z-30 px-4">
                      <div className="absolute -left-4 -right-8 -top-8 bottom-0 bg-gray-100/75 backdrop-blur dark:bg-zinc-800/75"></div>

                      <div className="absolute inset-y-3 left-0 flex h-6 w-6 flex-none -translate-x-12 items-center justify-center bg-gray-100 dark:bg-zinc-800">
                        <div
                          className={classNames(
                            'h-1.5 w-1.5 rounded-full ',
                            year === currentYear
                              ? 'bg-blue-400 ring-1 ring-blue-400 ring-offset-4 ring-offset-gray-100 dark:ring-offset-zinc-800'
                              : 'bg-gray-300 ring-1 ring-gray-300 dark:bg-zinc-500 dark:ring-zinc-500',
                          )}
                        />
                      </div>

                      <div className="relative z-20 flex justify-between rounded-md bg-white/60 px-[18px] py-3 text-gray-500 ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900/95 dark:text-gray-400">
                        <span>{year}</span>
                        <TotalsByStatus records={Array.from(records.values()).flat(1)} />
                      </div>
                    </DisclosureButton>

                    <DisclosurePanel className="relative w-full space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                      {Array.from(records.entries()).map(([title, records]) => {
                        return (
                          <Disclosure
                            key={title}
                            as="div"
                            defaultOpen={
                              !records.every((e) => {
                                return isFuture(resolveRelevantRecordDate(e))
                              })
                            }
                            className="relative flex gap-x-4"
                          >
                            <div className="absolute -bottom-8 -top-8 left-0 z-20 flex w-6 -translate-x-2 justify-center">
                              <div className="w-px bg-gray-300 dark:bg-zinc-500"></div>
                            </div>

                            <div className="relative ml-10 flex w-full flex-col gap-4">
                              <div className="sticky top-20 isolate z-20">
                                <div className="absolute -left-4 -right-8 -top-8 bottom-0 z-10 bg-gray-100/75 backdrop-blur dark:bg-zinc-800/75"></div>

                                <DisclosureButton className="w-full">
                                  <div className="absolute inset-y-3 left-0 flex h-6 w-6 flex-none -translate-x-12 items-center justify-center bg-gray-100 dark:bg-zinc-800">
                                    <div
                                      className={classNames(
                                        'h-1.5 w-1.5 rounded-full ',
                                        title === currentQuarter
                                          ? 'bg-blue-400 ring-1 ring-blue-400 ring-offset-4 ring-offset-gray-100 dark:ring-offset-zinc-800'
                                          : 'bg-gray-300 ring-1 ring-gray-300 dark:bg-zinc-500 dark:ring-zinc-500',
                                      )}
                                    />
                                  </div>

                                  <div className="relative z-20 flex w-full justify-between rounded-md bg-white/95 px-[18px] py-3 text-gray-500 ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900/95 dark:text-gray-400">
                                    <span>{title}</span>
                                    <TotalsByStatus records={records} />
                                  </div>
                                </DisclosureButton>
                              </div>

                              <DisclosurePanel className="grid grid-cols-[repeat(auto-fill,minmax(275px,1fr))] gap-4">
                                {records.map((record) => {
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
                                      <Link href={`/${record.type}/${record.number}`}>
                                        <TinyRecord record={record} />
                                      </Link>
                                    </I18NProvider>
                                  )
                                })}
                              </DisclosurePanel>
                            </div>
                          </Disclosure>
                        )
                      })}
                    </DisclosurePanel>
                  </div>
                </Disclosure>
              )
            })}

            <div className="relative ml-8 flex -translate-x-2 gap-x-4">
              <div className="absolute bottom-8 left-0 top-0 flex w-6 justify-center">
                <div className="w-px bg-gray-300 dark:bg-zinc-500"></div>
              </div>

              <div className="relative mt-3 flex h-6 w-6 flex-none items-center justify-center bg-gray-100 dark:bg-zinc-800">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ring-1 ring-gray-300 dark:bg-zinc-500 dark:ring-zinc-500" />
              </div>

              <div className="py-3 text-gray-500 dark:text-gray-300">
                The beginning of your adventure
              </div>
            </div>
          </>
        ) : (
          <Empty message="No records yet" />
        )}
      </div>
    </I18NProvider>
  )
}
