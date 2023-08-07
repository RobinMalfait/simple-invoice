import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { endOfQuarter, isWithinInterval, startOfQuarter, subQuarters } from 'date-fns'
import Link from 'next/link'
import { me, invoices as rawInvoices } from '~/data'
import { Client } from '~/domain/client/client'
import { isActiveEntity, isDeadEntity, isPaidEntity } from '~/domain/entity-filters'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { resolveRelevantEntityDate } from '~/domain/relevant-entity-date'
import { squashEntities } from '~/domain/squash-entities'
import { classNames } from '~/ui/class-names'
import { FormatRange } from '~/ui/date-range'
import { Empty } from '~/ui/empty'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TinyInvoice } from '~/ui/invoice/tiny-invoice'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

export default function Page() {
  let invoices = squashEntities(rawInvoices)

  let now = new Date()

  let start = startOfQuarter(now)
  let end = endOfQuarter(now)

  let previousRange = { start: subQuarters(start, 1), end: subQuarters(end, 1) }
  let currentRange = { start, end }

  let previousInvoices = invoices.filter((e) =>
    isWithinInterval(resolveRelevantEntityDate(e), previousRange),
  )
  let currentInvoices = invoices.filter((e) =>
    isWithinInterval(resolveRelevantEntityDate(e), currentRange),
  )

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of invoices.
        language: me.language,
        currency: me.currency,
      }}
    >
      <main className="isolate mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="-mb-8 -mt-8 flex items-center justify-between py-4">
          <div></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm dark:text-zinc-400">
                <FormatRange start={start} end={end} />
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <CompareBlock
            title="invoices"
            previous={previousInvoices}
            current={currentInvoices}
            value={(list) => list.length}
          />

          <CompareBlock
            title="upcoming"
            current={currentInvoices}
            value={(list) => list.filter((e) => isActiveEntity(e)).length}
          />

          <CompareBlock
            inverse
            title="rejected / expired"
            previous={previousInvoices}
            current={currentInvoices}
            value={(list) => list.filter((e) => isDeadEntity(e)).length}
          />

          <CompareBlock
            title="paid"
            previous={previousInvoices}
            current={currentInvoices}
            value={(list) =>
              list.filter((e) => isPaidEntity(e)).reduce((acc, e) => acc + total(e), 0)
            }
            display={(value) => <Money amount={value} />}
          />
        </div>

        {(() => {
          let data = currentInvoices.filter((e) => isActiveEntity(e))

          return (
            <div
              className={classNames(
                'overflow-auto rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-zinc-800',
                data.length === 0 && 'opacity-50 transition-opacity duration-300 hover:opacity-100',
              )}
            >
              <div className="border-b p-4 dark:border-zinc-900/75 dark:text-zinc-400">
                Active quotes / invoices ({data.length})
              </div>
              {data.length > 0 ? (
                <div className="grid auto-cols-[minmax(275px,1fr)] grid-flow-col grid-cols-[repeat(auto-fill,minmax(275px,1fr))] gap-4 overflow-x-auto p-4">
                  {data.map((invoice) => (
                    <I18NProvider
                      key={invoice.id}
                      value={{
                        // Prefer the language of the account when looking at the overview of invoices.
                        language: invoice.account.language,

                        // Prefer the currency of the client when looking at the overview of invoices.
                        currency: invoice.client.currency,
                      }}
                    >
                      <Link href={`/${invoice.type}/${invoice.number}`}>
                        <TinyInvoice invoice={invoice} />
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

        <div className="grid grid-cols-2 gap-8">
          {(() => {
            let totalInvoiceSales = currentInvoices
              .filter((e) => isPaidEntity(e))
              .reduce((acc, e) => acc + total(e), 0)

            let data = Array.from(
              currentInvoices
                .reduce((acc, e) => {
                  if (!isPaidEntity(e)) return acc

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
                  'overflow-auto rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-zinc-800',
                  data.length === 0 &&
                    'opacity-50 transition-opacity duration-300 hover:opacity-100',
                )}
              >
                <div className="border-b p-4 dark:border-zinc-900/75 dark:text-zinc-400">
                  Top paying clients
                </div>
                {data.length > 0 ? (
                  <div className="flex-1 divide-y divide-gray-100 dark:divide-zinc-900">
                    {data.map(([id, { client, total }], idx) => (
                      <I18NProvider key={id} value={client}>
                        <div className="group relative flex items-center p-3 first:border-t-[1px] first:border-t-transparent focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:border-zinc-800">
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
      </main>
    </I18NProvider>
  )
}

type Entity = Quote | Invoice | Receipt

function CompareBlock({
  title,
  value,
  previous = null,
  current,
  display = (i) => <>{i}</>,
  inverse = false,
}: {
  title: string
  value: (values: Entity[]) => number
  current: Entity[]
  previous?: Entity[] | null
  display?: (value: number) => React.ReactElement
  inverse?: boolean
}) {
  let previousValue = previous !== null ? value(previous) : null
  let currentValue = value(current)

  return (
    <div className="flex gap-2 rounded-md bg-white p-4 shadow ring-1 ring-black/5 dark:bg-zinc-800">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600 dark:text-zinc-400">{title}</span>
        <div className="flex items-baseline">
          <span className="text-2xl font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
            {display(currentValue)}
          </span>
          {previousValue !== null && (
            <span className="-translate-y-0.5">
              {match(Math.sign(currentValue - previousValue!), {
                [1]: () => (
                  <span
                    className={classNames(
                      'ml-2 flex items-baseline text-sm font-semibold',
                      inverse
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400',
                    )}
                  >
                    <ArrowUpIcon
                      className={classNames(
                        'h-5 w-5 shrink-0 self-center',
                        inverse
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-green-500 dark:text-green-400',
                      )}
                    />
                    {display(currentValue - previousValue!)}
                  </span>
                ),
                [0]: () => null,
                [-1]: () => (
                  <span
                    className={classNames(
                      'ml-2 flex items-baseline text-sm font-semibold',
                      inverse
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    <ArrowDownIcon
                      className={classNames(
                        'h-5 w-5 shrink-0 self-center',
                        inverse
                          ? 'text-green-500 dark:text-green-400'
                          : 'text-red-500 dark:text-red-400',
                      )}
                    />
                    {display(currentValue - previousValue!)}
                  </span>
                ),
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
