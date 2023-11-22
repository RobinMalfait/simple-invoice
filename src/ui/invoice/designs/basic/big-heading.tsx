import { CubeIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { CreditNote } from '~/domain/credit-note/credit-note'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { Address } from '~/ui/address/address'
import { Classified } from '~/ui/classified'
import { useLocale } from '~/ui/hooks/use-locale'
import { useRecord } from '~/ui/hooks/use-record'
import { useTranslation } from '~/ui/hooks/use-translation'
import { match } from '~/utils/match'

export function BigHeading() {
  let locale = useLocale()
  let record = useRecord()
  let t = useTranslation()

  return (
    <>
      <div className="bg-gray-50 px-12 py-8">
        <CubeIcon className="h-12 text-gray-400" />

        <div className="mt-4 flex items-end justify-between">
          <span className="space-x-3 text-2xl">
            <span>
              <span className="font-medium text-gray-500">
                {t((x) => {
                  return match(record.type, {
                    quote: () => {
                      return x.quote.title
                    },
                    invoice: () => {
                      return x.invoice.title
                    },
                    'credit-note': () => {
                      return x['credit-note'].title
                    },
                    receipt: () => {
                      return x.receipt.title
                    },
                  })
                })}
              </span>
              <span className="text-gray-300">.</span>
            </span>
            <span className="text-lg text-gray-300">/</span>
            <span className="text-lg tabular-nums text-gray-500">{record.number}</span>
          </span>
          <div className="text-right">
            <div className="space-x-3">
              <span className="text-gray-500">
                {t((x) => {
                  return match(record.type, {
                    quote: () => {
                      return x.dates.quoteDate
                    },
                    invoice: () => {
                      return x.dates.issueDate
                    },
                    'credit-note': () => {
                      return x['credit-note'].fields.invoice
                    },
                    receipt: () => {
                      return x.receipt.fields.invoice
                    },
                  })
                })}
              </span>
              <span className="font-medium tabular-nums text-gray-700">
                {match(
                  record.type,
                  {
                    quote: (r: Quote) => {
                      return format(r.quoteDate, 'PPP', { locale })
                    },
                    invoice: (r: Invoice) => {
                      return format(r.issueDate, 'PPP', { locale })
                    },
                    'credit-note': (r: CreditNote) => {
                      return r.invoice.number
                    },
                    receipt: (r: Receipt) => {
                      return r.invoice.number
                    },
                  },
                  record,
                )}
              </span>
            </div>
            <div className="space-x-3">
              <span className="text-gray-500">
                {t((x) => {
                  return match(record.type, {
                    quote: () => {
                      return x.dates.quoteExpirationDate
                    },
                    invoice: () => {
                      return x.dates.dueDate
                    },
                    'credit-note': () => {
                      return x.dates.creditNoteDate
                    },
                    receipt: () => {
                      return x.dates.receiptDate
                    },
                  })
                })}
              </span>
              <span className="font-medium tabular-nums text-gray-700">
                {match(
                  record.type,
                  {
                    quote: (r: Quote) => {
                      return format(r.quoteExpirationDate, 'PPP', { locale })
                    },
                    invoice: (r: Invoice) => {
                      return format(r.dueDate, 'PPP', { locale })
                    },
                    'credit-note': (r: CreditNote) => {
                      return format(r.creditNoteDate, 'PPP', { locale })
                    },
                    receipt: (r: Receipt) => {
                      return format(r.receiptDate, 'PPP', { locale })
                    },
                  },
                  record,
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between px-12 py-8 text-gray-500">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-gray-900">
            {t((x) => {
              return x.account.title
            })}
          </h3>
          <div className="flex flex-1 flex-col whitespace-pre-wrap text-sm font-normal">
            <div className="flex-1">
              <span>{record.account.name}</span>
              <Address address={record.account.billing} />
            </div>
            {record.account.tax && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900">
                  {t((x) => {
                    return x.account.taxId[record.account.tax!.id]
                  })}
                </div>
                <div>
                  <Classified>{record.account.tax.value}</Classified>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-gray-900">
            {t((x) => {
              return x.client.title
            })}
          </h3>
          <div className="flex flex-1 flex-col whitespace-pre-wrap text-sm font-normal">
            <div className="flex-1">
              <span>{record.client.name}</span>
              <Address address={record.client.billing} />
            </div>
            {record.client.tax && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900">
                  {t((x) => {
                    return x.client.taxId[record.client.tax!.id]
                  })}
                </div>
                <div>
                  <Classified>{record.client.tax.value}</Classified>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
