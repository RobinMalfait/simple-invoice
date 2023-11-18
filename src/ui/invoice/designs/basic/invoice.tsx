'use client'

import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { Receipt } from '~/domain/receipt/receipt'
import { isInvoice } from '~/domain/record/filters'
import { Classified } from '~/ui/classified'
import { parseMarkdown } from '~/ui/document/document'
import { useFittedPagination } from '~/ui/hooks/use-fitted-pagination'
import { useIbanQrCodeData } from '~/ui/hooks/use-iban-qr-code-data'
import { PageProvider } from '~/ui/hooks/use-pagination-info'
import { RecordProvider, useRecord } from '~/ui/hooks/use-record'
import { useTranslation } from '~/ui/hooks/use-translation'
import { QRCode } from '~/ui/qr-code'
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
  let qrCodeData = useIbanQrCodeData(record)
  let t = useTranslation()

  let isQRCodeEnabled =
    isInvoice(record) && (record.qr ?? record.client.qr ?? record.account.qr ?? false)

  return (
    <RecordProvider record={record}>
      <div className="grid w-full grid-flow-row gap-8 font-pdf print:gap-0">
        {pages.map(([items], pageIdx) => {
          return (
            <PageProvider key={pageIdx} info={{ total: pages.length, current: pageIdx }}>
              <div className="paper relative mx-auto flex flex-col bg-white print:m-0">
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
                                quote: () => {
                                  return null
                                },
                                invoice: () => {
                                  return null
                                },
                                receipt: (r: Receipt) => {
                                  return r.invoice.status
                                },
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

                {pageIdx === pages.length - 1 && (
                  <div className="flex w-full items-end justify-between px-8 pb-4 pt-1">
                    {notes.length > 0 ? (
                      <div className="relative w-full max-w-sm space-y-1 rounded-md bg-gray-50 p-4 text-xs">
                        <div className="absolute -right-3 -top-3 rounded-full bg-gray-50 p-1">
                          <InformationCircleIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(notes.join('\n')) }}
                        />
                      </div>
                    ) : (
                      <div />
                    )}

                    {isQRCodeEnabled && qrCodeData !== null && (
                      <div className="relative rounded-lg border border-gray-400 p-3 pt-4">
                        <span className="absolute inset-x-0 top-0 flex -translate-y-2 items-center justify-center">
                          <span className="bg-white px-1 text-xs text-gray-600">
                            {t((x) => {
                              return x.qr.label
                            })}
                          </span>
                        </span>
                        <Classified>
                          <QRCode scale={3}>{qrCodeData}</QRCode>
                        </Classified>
                      </div>
                    )}
                  </div>
                )}

                {pageIdx === pages.length - 1 ? <BigFooter /> : <SmallFooter />}
              </div>
            </PageProvider>
          )
        })}

        {record.attachments.map((document) => {
          return <Attachment key={document.id} document={document} />
        })}
      </div>
    </RecordProvider>
  )
}
