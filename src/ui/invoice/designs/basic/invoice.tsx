'use client'

import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { Receipt } from '~/domain/receipt/receipt'
import { useFittedPagination } from '~/ui/hooks/use-fitted-pagination'
import { RecordProvider, useRecord } from '~/ui/hooks/use-record'
import { PageProvider } from '~/ui/hooks/use-pagination-info'
import { match } from '~/utils/match'
import { Attachment } from './attachment'
import { BigFooter } from './big-footer'
import { BigHeading } from './big-heading'
import { Items } from './items'
import { SmallFooter } from './small-footer'
import { SmallHeading } from './small-heading'
import { Summary } from './summary'

export function Invoice() {
  let record = useRecord()
  let [pages, FitContent] = useFittedPagination(record.items)
  let notes = [record.note, record.client.note, record.account.note].filter(Boolean)

  return (
    <RecordProvider record={record}>
      <div className="grid w-full grid-flow-row gap-8 print:gap-0">
        {pages.map(([items], pageIdx) => (
          <PageProvider key={pageIdx} info={{ total: pages.length, current: pageIdx }}>
            <div className="paper relative mx-auto flex flex-col bg-white dark:bg-zinc-950/70 print:m-0">
              {pageIdx === 0 ? <BigHeading /> : <SmallHeading />}

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <FitContent>
                  <Items items={items}>
                    {pageIdx === pages.length - 1 ? (
                      <>
                        <Summary
                          items={record.items}
                          discounts={record.discounts}
                          type="all"
                          status={match(
                            record.type,
                            {
                              quote: () => null,
                              invoice: () => null,
                              receipt: (r: Receipt) => r.invoice.status,
                            },
                            record,
                          )}
                        />
                      </>
                    ) : (
                      <Summary items={items} discounts={[]} type="subtotal" status={null} />
                    )}
                  </Items>
                </FitContent>
              </div>

              {pageIdx === pages.length - 1 && notes.length > 0 && (
                <div className="px-8 py-4">
                  <div className="relative max-w-sm space-y-1 rounded-md bg-gray-50 p-4 text-xs dark:bg-zinc-900 dark:text-zinc-200">
                    <div className="absolute -right-3 -top-3 rounded-full bg-gray-50 p-1 dark:bg-zinc-900">
                      <InformationCircleIcon className="h-6 w-6 text-gray-400 dark:text-zinc-400" />
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

        {record.attachments.map((document) => (
          <Attachment key={document.id} document={document} />
        ))}
      </div>
    </RecordProvider>
  )
}
