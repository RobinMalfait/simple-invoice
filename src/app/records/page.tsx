import { compareDesc, format, isFuture } from 'date-fns'
import Link from 'next/link'

import { me, records } from '~/data'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { Record, combineRecords, resolveRelevantRecordDate } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { Empty } from '~/ui/empty'
import { Disclosure, DisclosureButton, DisclosurePanel } from '~/ui/headlessui'
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
      .sort(
        (a, z) =>
          compareDesc(resolveRelevantRecordDate(a), resolveRelevantRecordDate(z)) ||
          z.number.localeCompare(a.number),
      )

      // Group by quarter & year
      .reduce((acc, record) => {
        let key = match(
          record.type,
          {
            quote: (r: Quote) => titleForQuarter(r.quoteDate),
            invoice: (r: Invoice) => titleForQuarter(r.issueDate),
            receipt: (r: Receipt) => titleForQuarter(r.receiptDate),
          },
          record,
        )
        if (!acc.has(key)) acc.set(key, [])
        acc.get(key)!.push(record)
        return acc
      }, new Map<string, Record[]>()),
  )
}

export default async function Home() {
  let combinedRecords = combineRecords(records)

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of records.
        language: me.language,
        currency: me.currency,
      }}
    >
      <div className="fixed inset-x-0 top-0 z-10 h-8 bg-gray-100/75 backdrop-blur dark:bg-zinc-800/75 lg:top-4"></div>
      <div className="relative px-4 py-8 space-y-8 sm:px-6 lg:px-8">
        {combinedRecords.length > 0 ? (
          <>
            {groupByQuarter(combinedRecords).map(([title, records], idx) => {
              return (
                <Disclosure
                  defaultOpen={!records.every((e) => isFuture(resolveRelevantRecordDate(e)))}
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

                  <div className="relative flex flex-col w-full ml-10 gap-4">
                    <DisclosureButton className="sticky z-20 top-8 isolate">
                      <div className="absolute left-0 flex items-center justify-center flex-none w-6 h-6 bg-gray-100 inset-y-3 -translate-x-12 dark:bg-zinc-800">
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
                      {records.map((record) => (
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
                      ))}
                    </DisclosurePanel>
                  </div>
                </Disclosure>
              )
            })}

            <div className="relative flex -translate-x-2 gap-x-4">
              <div className="absolute top-0 left-0 flex justify-center w-6 bottom-8">
                <div className="w-px bg-gray-300 dark:bg-zinc-500"></div>
              </div>

              <div className="relative flex items-center justify-center flex-none w-6 h-6 mt-3 bg-gray-100 dark:bg-zinc-800">
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
