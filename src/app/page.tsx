import { compareDesc, format } from 'date-fns'
import Link from 'next/link'
import * as React from 'react'

import { invoices, me } from '~/data'
import { Invoice } from '~/domain/invoice/invoice'
import { Empty } from '~/ui/empty'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TinyInvoice } from '~/ui/invoice/tiny-invoice'
import { TotalFeatures, total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'

export default async function Home() {
  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of invoices.
        language: me.language,
        currency: me.currency,
      }}
    >
      <main className="isolate mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {invoices.length > 0 ? (
          <ul role="list" className="grid grid-cols-[repeat(auto-fill,minmax(275px,1fr))] gap-4">
            {Object.entries(
              invoices
                // Put most recent invoices first
                .sort((a, z) => compareDesc(a.issueDate, z.issueDate))

                // Group by quarter & year
                .reduce(
                  (acc, invoice) => {
                    let key = [
                      format(invoice.issueDate, 'QQQ'),
                      format(invoice.issueDate, 'y'),
                    ].join(' • ')

                    acc[key] = acc[key] || []
                    acc[key].push(invoice)

                    return acc
                  },
                  {} as Record<string, Invoice[]>,
                ),
            ).map(([title, invoices]) => (
              <React.Fragment key={title}>
                <div className="col-span-full flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-black/5">
                  <span>{title}</span>
                  <span>
                    <Money
                      amount={invoices.reduce(
                        (acc, invoice) => acc + total(invoice.items, TotalFeatures.IncludingVAT),
                        0,
                      )}
                    />
                  </span>
                </div>

                {invoices.map((invoice) => (
                  <Link key={invoice.id} href={`/invoices/${invoice.number}`}>
                    <TinyInvoice invoice={invoice} />
                  </Link>
                ))}
              </React.Fragment>
            ))}
          </ul>
        ) : (
          <Empty message="No invoices yet" />
        )}
      </main>
    </I18NProvider>
  )
}
