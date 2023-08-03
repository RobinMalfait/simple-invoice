import { format } from 'date-fns'
import Link from 'next/link'

import { invoices, me } from '~/data'
import { Currency } from '~/domain/currency/currency'
import { Invoice } from '~/domain/invoice/invoice'
import { classNames } from '~/ui/class-names'
import { Empty } from '~/ui/empty'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TinyInvoice } from '~/ui/invoice/tiny-invoice'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'

function groupByQuarter(invoices: Invoice[]) {
  return Array.from(
    invoices
      // Put most recent invoices first
      .sort((a, z) => z.number.localeCompare(a.number))

      // Group by quarter & year
      .reduce((acc, invoice) => {
        let key = [format(invoice.issueDate, 'QQQ'), format(invoice.issueDate, 'y')].join(' • ')
        if (!acc.has(key)) acc.set(key, [])
        acc.get(key)!.push(invoice)
        return acc
      }, new Map<string, Invoice[]>()),
  )
}

function groupByCurrency(invoices: Invoice[]) {
  return Array.from(
    invoices.reduce((acc, invoice) => {
      let key = invoice.client.currency
      if (!acc.has(key)) acc.set(key, [])
      acc.get(key)!.push(invoice)
      return acc
    }, new Map<Currency, Invoice[]>()),
  )
}

export default async function Home() {
  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of invoices.
        language: me.language,
        currency: me.currency,
      }}
    >
      <main className="isolate mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {invoices.length > 0 ? (
          <>
            {groupByQuarter(invoices).map(([title, invoices], idx) => (
              <div key={title} className="relative flex gap-x-4">
                <div
                  className={classNames(
                    idx === 0 ? '-top-8' : 'top-0',
                    'absolute -bottom-8 left-0 flex w-6 justify-center',
                  )}
                >
                  <div className="w-px bg-gray-300"></div>
                </div>

                <div className="sticky top-24 mt-3 flex h-6 w-6 flex-none items-center justify-center bg-gray-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ring-1 ring-gray-300" />
                </div>

                <div className="relative flex w-full flex-col gap-4">
                  <div className="sticky top-[84px] isolate z-20">
                    <div className="absolute -inset-x-2 -top-6 bottom-11 z-10 bg-gray-100"></div>
                    <div className="relative z-20 flex justify-between rounded-md bg-white/95 p-3 text-gray-500 ring-1 ring-black/5">
                      <span>{title}</span>
                      <span className="flex items-center gap-2">
                        {groupByCurrency(invoices).map(([currency, invoices], idx) => (
                          <I18NProvider
                            key={currency}
                            value={{
                              // Prefer my language when looking at the overview of invoices.
                              language: me.language,

                              // Prefer the currency of the client when looking at the overview of invoices.
                              currency,
                            }}
                          >
                            {idx !== 0 && <span className="text-gray-300">•</span>}
                            <Money
                              amount={invoices.reduce((acc, invoice) => acc + total(invoice), 0)}
                            />
                          </I18NProvider>
                        ))}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(275px,1fr))] gap-4">
                    {invoices.map((invoice) => (
                      <I18NProvider
                        key={invoice.id}
                        value={{
                          // Prefer the language of the account when looking at the overview of invoices.
                          language: invoice.account.language,

                          // Prefer the currency of the client when looking at the overview of invoices.
                          currency: invoice.client.currency,
                        }}
                      >
                        <Link href={`/invoices/${invoice.number}`}>
                          <TinyInvoice invoice={invoice} />
                        </Link>
                      </I18NProvider>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="relative flex gap-x-4">
              <div className="absolute bottom-8 left-0 top-0 flex w-6 justify-center">
                <div className="w-px bg-gray-300"></div>
              </div>

              <div className="relative mt-3 flex h-6 w-6 flex-none items-center justify-center bg-gray-100">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ring-1 ring-gray-300" />
              </div>

              <div className="py-3 text-gray-500">The beginning of your adventure</div>
            </div>
          </>
        ) : (
          <Empty message="No invoices yet" />
        )}
      </main>
    </I18NProvider>
  )
}
