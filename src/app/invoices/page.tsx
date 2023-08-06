import { compareDesc, format, isFuture } from 'date-fns'
import Link from 'next/link'

import { invoices, me } from '~/data'
import { Currency } from '~/domain/currency/currency'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { resolveRelevantEntityDate } from '~/domain/relevant-entity-date'
import { squashEntities } from '~/domain/squash-entities'
import { classNames } from '~/ui/class-names'
import { Empty } from '~/ui/empty'
import { Disclosure, DisclosureButton, DisclosurePanel } from '~/ui/headlessui'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TinyInvoice } from '~/ui/invoice/tiny-invoice'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

type Entity = Quote | Invoice | Receipt

function titleForQuarter(date: Date) {
  return [format(date, 'QQQ'), format(date, 'y')].join(' • ')
}

function groupByQuarter(invoices: Entity[]) {
  return Array.from(
    invoices
      .sort((a, z) => compareDesc(resolveRelevantEntityDate(a), resolveRelevantEntityDate(z)))

      // Group by quarter & year
      .reduce((acc, entity) => {
        let key = match(
          entity.type,
          {
            quote: (entity: Quote) => titleForQuarter(entity.quoteDate),
            invoice: (entity: Invoice) => titleForQuarter(entity.issueDate),
            receipt: (entity: Receipt) => titleForQuarter(entity.receiptDate),
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
              <Disclosure
                defaultOpen={!invoices.every((e) => isFuture(resolveRelevantEntityDate(e)))}
                as="div"
                key={title}
                className="relative flex gap-x-4"
              >
                <div
                  className={classNames(
                    idx === 0 ? '-top-8' : 'top-0',
                    'absolute -bottom-8 left-0 flex w-6 justify-center',
                  )}
                >
                  <div className="w-px bg-gray-300 dark:bg-zinc-500"></div>
                </div>

                <div className="sticky top-24 mt-3 flex h-6 w-6 flex-none items-center justify-center bg-gray-100 dark:bg-zinc-900">
                  <div
                    className={classNames(
                      'h-1.5 w-1.5 rounded-full ',
                      title === titleForQuarter(new Date())
                        ? 'bg-blue-400 ring-1 ring-blue-400 ring-offset-4 ring-offset-gray-100 dark:ring-offset-zinc-950'
                        : 'bg-gray-300 ring-1 ring-gray-300 dark:bg-zinc-500 dark:ring-zinc-500',
                    )}
                  />
                </div>

                <div className="relative flex w-full flex-col gap-4">
                  <DisclosureButton className="sticky top-[84px] isolate z-20">
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
                  </DisclosureButton>

                  <DisclosurePanel className="grid grid-cols-[repeat(auto-fill,minmax(275px,1fr))] gap-4">
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
                  </DisclosurePanel>
                </div>
              </Disclosure>
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
