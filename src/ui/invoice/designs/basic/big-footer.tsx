import { DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { useInvoice } from '~/ui/hooks/use-invoice'
import { TotalFeatures, total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'

export function BigFooter() {
  let invoice = useInvoice()
  let legal = [invoice.client.legal, invoice.account.legal].filter(Boolean)

  return (
    <div>
      <div className="relative space-y-12 bg-gray-50 px-12 py-8 text-gray-900">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xl font-medium">
            <span>Totaal</span>
            <div className="-mx-4 -my-2 rounded-full bg-black px-4 py-2 text-white">
              <Money amount={total(invoice.items, TotalFeatures.IncludingVAT)} />
            </div>
          </div>

          <table className="text-sm">
            <tbody>
              {invoice.account.email && (
                <tr>
                  <td className="text-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                  </td>
                  <td className="px-3">{invoice.account.email}</td>
                </tr>
              )}
              {invoice.account.phone && (
                <tr>
                  <td className="text-center">
                    <DevicePhoneMobileIcon className="h-4 w-4 text-gray-500" />
                  </td>
                  <td className="px-3">{invoice.account.phone}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {legal.length > 0 && (
          <div className="w-full text-center">
            <div className="whitespace-pre-wrap text-center text-xs empty:hidden">
              {legal.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
