import { CubeIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { Address } from '~/ui/address/address'
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
      <div className="bg-gray-50 px-12 py-8 dark:bg-zinc-900">
        <CubeIcon className="h-12 text-gray-400 dark:text-zinc-200" />

        <div className="mt-4 flex items-end justify-between">
          <span className="space-x-3 text-2xl">
            <span>
              <span className="font-medium text-gray-500 dark:text-zinc-100">
                {t((x) =>
                  match(record.type, {
                    quote: () => x.quote.title,
                    invoice: () => x.invoice.title,
                    receipt: () => x.receipt.title,
                  }),
                )}
              </span>
              <span className="text-gray-300 dark:text-zinc-50">.</span>
            </span>
            <span className="text-lg text-gray-300 dark:text-zinc-400">/</span>
            <span className="text-lg tabular-nums text-gray-500 dark:text-zinc-300">
              {record.number}
            </span>
          </span>
          <div className="text-right">
            <div className="space-x-3">
              <span className="text-gray-500 dark:text-zinc-400">
                {t((x) =>
                  match(record.type, {
                    quote: () => x.dates.quoteDate,
                    invoice: () => x.dates.issueDate,
                    receipt: () => x.receipt.fields.invoice,
                  }),
                )}
              </span>
              <span className="font-medium tabular-nums text-gray-700 dark:text-zinc-300">
                {match(
                  record.type,
                  {
                    quote: (r: Quote) => format(r.quoteDate, 'PPP', { locale }),
                    invoice: (r: Invoice) => format(r.issueDate, 'PPP', { locale }),
                    receipt: (r: Receipt) => r.invoice.number,
                  },
                  record,
                )}
              </span>
            </div>
            <div className="space-x-3">
              <span className="text-gray-500 dark:text-zinc-400">
                {t((x) =>
                  match(record.type, {
                    quote: () => x.dates.quoteExpirationDate,
                    invoice: () => x.dates.dueDate,
                    receipt: () => x.dates.receiptDate,
                  }),
                )}
              </span>
              <span className="font-medium tabular-nums text-gray-700 dark:text-zinc-300">
                {match(
                  record.type,
                  {
                    quote: (r: Quote) => format(r.quoteExpirationDate, 'PPP', { locale }),
                    invoice: (r: Invoice) => format(r.dueDate, 'PPP', { locale }),
                    receipt: (r: Receipt) => format(r.receiptDate, 'PPP', { locale }),
                  },
                  record,
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between px-12 py-8 text-gray-500 dark:text-gray-300">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-50">
            {t((x) => x.account.title)}
          </h3>
          <div className="flex flex-1 flex-col whitespace-pre-wrap text-sm font-normal">
            <div className="flex-1">
              <span>{record.account.name}</span>
              <Address address={record.account.billing} />
            </div>
            {record.account.tax && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900 dark:text-zinc-50">
                  {t((x) => x.account.vat)}
                </div>
                <div>{record.account.tax.value}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-50">
            {t((x) => x.client.title)}
          </h3>
          <div className="flex flex-1 flex-col whitespace-pre-wrap text-sm font-normal">
            <div className="flex-1">
              <span>{record.client.name}</span>
              <Address address={record.client.billing} />
            </div>
            {record.client.tax && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900 dark:text-zinc-50">
                  {t((x) => x.client.vat)}
                </div>
                <div>{record.client.tax.value}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
