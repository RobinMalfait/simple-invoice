import { CubeIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Address } from '~/ui/address/address'
import { useInvoice } from '~/ui/hooks/use-invoice'
import { useLocale } from '~/ui/hooks/use-locale'

export function BigHeading() {
  let locale = useLocale()
  let invoice = useInvoice()

  return (
    <>
      <div className="bg-gray-50 px-12 py-8">
        <CubeIcon className="h-12 text-gray-400" />

        <div className="mt-4 flex items-end justify-between">
          <span className="space-x-3 text-2xl">
            <span>
              <span className="font-medium text-gray-500">Factuur</span>
              <span className="text-gray-300">.</span>
            </span>
            <span className="text-lg text-gray-300">/</span>
            <span className="text-lg tabular-nums text-gray-500">{invoice.number}</span>
          </span>
          <div className="text-right">
            <div className="space-x-3">
              <span className="text-gray-500">Factuurdatum:</span>
              <span className="font-medium tabular-nums text-gray-700">
                {format(invoice.issueDate, 'PPP', { locale })}
              </span>
            </div>
            <div className="space-x-3">
              <span className="text-gray-500">Vervaldatum:</span>
              <span className="font-medium tabular-nums text-gray-700">
                {format(invoice.dueDate, 'PPP', { locale })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between px-12 py-8 text-gray-500">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Van:</h3>
          <div className="flex flex-col whitespace-pre-wrap text-sm font-normal">
            <span>{invoice.account.name}</span>
            <Address address={invoice.account.billing} />
            {invoice.account.tax && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900">BTW Nummer:</div>
                <div>{invoice.account.tax.value}</div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900">Naar:</h3>
          <div className="flex flex-col whitespace-pre-wrap text-sm font-normal">
            <span>{invoice.client.name}</span>
            <Address address={invoice.client.billing} />
            {invoice.client.tax && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900">BTW Nummer:</div>
                <div>{invoice.client.tax.value}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
