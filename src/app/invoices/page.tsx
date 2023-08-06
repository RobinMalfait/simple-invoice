import { format } from 'date-fns'
import Link from 'next/link'

import { invoices, me } from '~/data'
import { Currency } from '~/domain/currency/currency'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { classNames } from '~/ui/class-names'
import { Empty } from '~/ui/empty'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TinyInvoice } from '~/ui/invoice/tiny-invoice'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

type Entity = Quote | Invoice | Receipt

let entityOrder = ['quote', 'invoice', 'receipt']

function groupByQuarter(invoices: Entity[]) {
  return Array.from(
    invoices
      .sort((a, z) => {
        return (
          // Order by entity type
          entityOrder.indexOf(z.type) - entityOrder.indexOf(a.type) ||
          // Put most recent invoices first
          z.number.localeCompare(a.number)
        )
      })

      // Group by quarter & year
      .reduce((acc, entity) => {
        let key = match(
          entity.type,
          {
            quote: (entity: Quote) =>
              [format(entity.quoteDate, 'QQQ'), format(entity.quoteDate, 'y')].join(' • '),
            invoice: (entity: Invoice) =>
              [format(entity.issueDate, 'QQQ'), format(entity.issueDate, 'y')].join(' • '),
            receipt: (entity: Receipt) =>
              [format(entity.receiptDate, 'QQQ'), format(entity.receiptDate, 'y')].join(' • '),
          },
          entity,
        )
        if (!acc.has(key)) acc.set(key, [])
        acc.get(key)!.push(entity)
        return acc
      }, new Map<string, Entity[]>()),
  )
}

function groupByCurrency(invoices: Entity[]) {
  return Array.from(
    invoices.reduce((acc, invoice) => {
      let key = invoice.client.currency
      if (!acc.has(key)) acc.set(key, [])
      acc.get(key)!.push(invoice)
      return acc
    }, new Map<Currency, Entity[]>()),
  )
}

// We have 1 big list of all the quote, invoices and receipts. However, when we show the overview,
// we only want 1 entity to be present for each invoice. So we squash the list such that only 1
// entity is present instead of 2 or 3 (quote, invoice, receipt).
function squashEntities(entities: Entity[]) {
  let all = entities.slice()
  let toRemove = new Set<string>()

  for (let entity of entities) {
    if (entity.type === 'invoice' && entity.quote) {
      toRemove.add(entity.quote.id)
    } else if (entity.type === 'receipt') {
      toRemove.add(entity.invoice.id)
      if (entity.invoice.quote) toRemove.add(entity.invoice.quote.id)
    }
  }

  for (let entity of toRemove) {
    let idx = all.findIndex((e) => e.id === entity)
    if (idx !== -1) all.splice(idx, 1)
  }

  return all
}

export default async function Home() {
  let squashedInvoices = squashEntities(invoices)

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of invoices.
        language: me.language,
        currency: me.currency,
      }}
    >
      <main className="isolate mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {squashedInvoices.length > 0 ? (
          <>
            {groupByQuarter(squashedInvoices).map(([title, invoices], idx) => (
              <div key={title} className="relative flex gap-x-4">
                <div
                  className={classNames(
                    idx === 0 ? '-top-8' : 'top-0',
                    'absolute -bottom-8 left-0 flex w-6 justify-center',
                  )}
                >
                  <div className="w-px bg-gray-300 dark:bg-zinc-500"></div>
                </div>

                <div className="sticky top-24 mt-3 flex h-6 w-6 flex-none items-center justify-center bg-gray-100 dark:bg-zinc-900">
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ring-1 ring-gray-300 dark:bg-zinc-500 dark:ring-zinc-500" />
                </div>

                <div className="relative flex w-full flex-col gap-4">
                  <div className="sticky top-[84px] isolate z-20">
                    <div className="absolute -inset-x-1 -top-6 bottom-12 z-10 bg-gray-100 dark:bg-zinc-900"></div>
                    <div className="relative z-20 -mx-1.5 flex justify-between rounded-md bg-white/95 px-[18px] py-3 text-gray-500 ring-1 ring-black/5 backdrop-blur dark:bg-zinc-800/95 dark:text-gray-400">
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
                        <Link href={`/${invoice.type}/${invoice.number}`}>
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
                <div className="w-px bg-gray-300 dark:bg-zinc-500"></div>
              </div>

              <div className="relative mt-3 flex h-6 w-6 flex-none items-center justify-center bg-gray-100 dark:bg-zinc-900">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ring-1 ring-gray-300 dark:bg-zinc-500 dark:ring-zinc-500" />
              </div>

              <div className="py-3 text-gray-500 dark:text-gray-300">
                The beginning of your adventure
              </div>
            </div>
          </>
        ) : (
          <Empty message="No invoices yet" />
        )}
      </main>
    </I18NProvider>
  )
}