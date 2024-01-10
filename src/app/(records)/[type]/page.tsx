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
import { match } from '~/utils/match'

function titleForQuarter(date: Date) {
  return [format(date, 'QQQ'), format(date, 'y')].join(' • ')
}

function groupByQuarter(records: Record[]) {
  return Array.from(
    records
      .sort((a, z) => {
        return (
          compareDesc(resolveRelevantRecordDate(a), resolveRelevantRecordDate(z)) ||
          z.number.localeCompare(a.number)
        )
      })

      // Group by quarter & year
      .reduce((acc, record) => {
        let key = match(
          record.type,
          {
            quote: (r: Quote) => {
              return titleForQuarter(r.quoteDate)
            },
            invoice: (r: Invoice) => {
              return titleForQuarter(r.issueDate)
            },
            'credit-note': (r: CreditNote) => {
              return titleForQuarter(r.creditNoteDate)
            },
            receipt: (r: Receipt) => {
              return titleForQuarter(r.receiptDate)
            },
          },
          record,
        )
        if (!acc.has(key)) acc.set(key, [])
        acc.get(key)!.push(record)
        return acc
      }, new Map<string, Record[]>()),
  )
}

export default async function Home({ params: { type } }: { params: { type: string } }) {
  let filteredRecords = combineRecords(
    records.filter((e) => {
      return e.type === type
    }),
  )

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of records.
        language: me.language,
        currency: me.currency,
      }}
    >
      <div className="fixed inset-x-0 top-0 z-10 h-8 bg-gray-100/75 backdrop-blur lg:top-4 dark:bg-zinc-800/75"></div>
      <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {filteredRecords.length > 0 ? (
          <>
            {groupByQuarter(filteredRecords).map(([title, records], idx) => {
              return (
                <Disclosure
                  defaultOpen={
                    !records.every((e) => {
                      return isFuture(resolveRelevantRecordDate(e))
                    })
                  }
                  as="div"
                  key={title}
                  className="relative flex gap-x-4"
                >
                  <div
                    className={classNames(
                      idx === 0 ? '-top-8' : 'top-0',
                      'absolute -bottom-8 left-0 z-20 flex w-6 -translate-x-2 justify-center',
                    )}
                  >
                    <div className="w-px bg-gray-300 dark:bg-zinc-500"></div>
                  </div>

                  <div className="relative ml-10 flex w-full flex-col gap-4">
                    <DisclosureButton className="sticky top-8 isolate z-20">
                      <div className="absolute inset-y-3 left-0 flex h-6 w-6 flex-none -translate-x-12 items-center justify-center bg-gray-100 dark:bg-zinc-800">
                        <div
                          className={classNames(
                            'h-1.5 w-1.5 rounded-full ',
                            title === titleForQuarter(new Date())
                              ? 'bg-blue-400 ring-1 ring-blue-400 ring-offset-4 ring-offset-gray-100 dark:ring-offset-zinc-800'
                              : 'bg-gray-300 ring-1 ring-gray-300 dark:bg-zinc-500 dark:ring-zinc-500',
                          )}
                        />
                      </div>

                      <div className="relative z-20 -mx-1.5 flex justify-between rounded-md bg-white/95 px-[18px] py-3 text-gray-500 ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900/95 dark:text-gray-400">
                        <span>{title}</span>
                        <TotalsByStatus records={records} />
                      </div>
                    </DisclosureButton>

                    <DisclosurePanel className="grid grid-cols-[repeat(auto-fill,minmax(275px,1fr))] gap-4">
                      {records.map((record) => {
                        return (
                          <I18NProvider
                            key={record.id}
                            value={{
                              // Prefer the language of the account when looking at the overview of
                              // record.
                              language: record.account.language,

                              // Prefer the currency of the client when looking at the overview of
                              // record.
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

            <div className="relative flex -translate-x-2 gap-x-4">
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
          <Empty message={`No ${type}s yet`} />
        )}
      </div>
    </I18NProvider>
  )
}
