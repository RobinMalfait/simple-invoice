'use client'

import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { Invoice as InvoiceType } from '~/domain/invoice/invoice'
import { InvoiceProvider } from '~/ui/hooks/use-invoice'
import { useInvoicePagination } from '~/ui/hooks/use-invoice-pagination'
import { PageProvider } from '~/ui/hooks/use-pagination-info'
import { StatusDisplay } from '~/ui/invoice/status'
import { BigFooter } from './big-footer'
import { BigHeading } from './big-heading'
import { Items } from './items'
import { SmallFooter } from './small-footer'
import { SmallHeading } from './small-heading'
import { Summary } from './summary'

export function Invoice({ invoice }: { invoice: InvoiceType }) {
  let [pages, FitContent] = useInvoicePagination(invoice.items)
  let notes = [invoice.note, invoice.client.note, invoice.account.note].filter(Boolean)

  return (
    <InvoiceProvider invoice={invoice}>
      <div className="grid w-full grid-flow-row gap-8 print:gap-0">
        {pages.map((items, pageIdx) => (
          <PageProvider key={pageIdx} info={{ total: pages.length, current: pageIdx }}>
            <div className="paper relative mx-auto flex flex-col bg-white print:m-0">
              {pageIdx === 0 && (
                <div className="absolute right-4 top-4 z-20 print:hidden">
                  <StatusDisplay status={invoice.state} />
                </div>
              )}
              {pageIdx === 0 ? <BigHeading /> : <SmallHeading />}

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <FitContent>
                  <Items items={items}>
                    {pageIdx === pages.length - 1 ? (
                      <>
                        <Summary items={invoice.items} discounts={invoice.discounts} type="all" />
                      </>
                    ) : (
                      <Summary items={items} discounts={[]} type="subtotal" />
                    )}
                  </Items>
                </FitContent>
              </div>

              {pageIdx === pages.length - 1 && notes.length > 0 && (
                <div className="px-8 py-4">
                  <div className="relative max-w-sm space-y-1 rounded-md bg-gray-50 p-4 text-xs">
                    <div className="absolute -right-3 -top-3 rounded-full bg-gray-50 p-1">
                      <InformationCircleIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    {notes.map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {pageIdx === pages.length - 1 ? <BigFooter /> : <SmallFooter />}
            </div>
          </PageProvider>
        ))}
      </div>
    </InvoiceProvider>
  )
}
