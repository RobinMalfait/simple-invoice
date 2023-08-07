import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { endOfQuarter, isWithinInterval, startOfQuarter, subQuarters } from 'date-fns'
import Link from 'next/link'
import { me, invoices as rawInvoices } from '~/data'
import { Invoice } from '~/domain/invoice/invoice'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { Quote } from '~/domain/quote/quote'
import { QuoteStatus } from '~/domain/quote/quote-status'
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
              <span className="text-sm">
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
            value={(list) =>
              list.filter(
                (e) =>
                  (e.type === 'quote' &&
                    ![QuoteStatus.Rejected, QuoteStatus.Expired].includes(e.status)) ||
                  (e.type === 'invoice' &&
                    [InvoiceStatus.Draft, InvoiceStatus.Sent].includes(e.status)),
              ).length
            }
          />

          <CompareBlock
            inverse
            title="rejected / expired"
            previous={previousInvoices}
            current={currentInvoices}
            value={(list) =>
              list.filter(
                (e) =>
                  (e.type === 'quote' &&
                    [QuoteStatus.Rejected, QuoteStatus.Expired].includes(e.status)) ||
                  (e.type === 'invoice' && e.status === InvoiceStatus.Overdue),
              ).length
            }
          />

          <CompareBlock
            title="paid"
            previous={previousInvoices}
            current={currentInvoices}
            value={(list) =>
              list
                .filter(
                  (e) =>
                    (e.type === 'invoice' && e.status === InvoiceStatus.Paid) ||
                    e.type === 'receipt',
                )
                .reduce((acc, e) => acc + total(e), 0)
            }
            display={(value) => <Money amount={value} />}
          />
        </div>

        {(() => {
          let data = currentInvoices.filter((e) => {
                return (
                  (e.type === 'quote' &&
                    ![QuoteStatus.Expired, QuoteStatus.Rejected].includes(e.status)) ||
                  (e.type === 'invoice' &&
                    [InvoiceStatus.Draft, InvoiceStatus.Sent, InvoiceStatus.PartialPaid].includes(
                      e.status,
                    ))
                )
              })

          return (
            <div
              className={classNames(
                'overflow-auto rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-zinc-800',
                data.length === 0 && 'opacity-50 transition-opacity duration-300 hover:opacity-100',
              )}
            >
              <div className="border-b p-4 dark:border-zinc-900/75 dark:text-zinc-400">
                Active quotes / invoices
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
