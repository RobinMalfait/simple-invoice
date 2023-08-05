import * as HI from '@heroicons/react/24/outline'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import { useInvoice } from '~/ui/hooks/use-invoice'
import { useTranslation } from '~/ui/hooks/use-translation'
import { PaypalIcon } from '~/ui/icons/payment'
import * as SocialIcons from '~/ui/icons/social'
import { Legal } from '~/ui/invoice/blocks/legal'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

export function BigFooter() {
  let invoice = useInvoice()
  let t = useTranslation()

  return (
    <div>
      <div className="relative space-y-12 bg-gray-50 px-12 py-8 text-gray-900">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xl font-medium">
            <span>{t((x) => x.summary.total)}</span>
            <div className="-mx-4 -my-2 rounded-full bg-black px-4 py-2 text-white">
              <Money
                amount={match(invoice.type, {
                  quote: () => total(invoice),
                  invoice: () => total(invoice),
                  receipt: () => 0,
                })}
              />
            </div>
          </div>

          <div className="flex items-start gap-8">
            {invoice.account.contactFields.length > 0 && (
              <table className="text-sm">
                <thead>
                  <tr>
                    <td colSpan={2} className="text-sm font-medium text-gray-900">
                      {t((x) => x.summary.contactDetails)}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {invoice.account.contactFields.map((field) => {
                    let Icon =
                      field.icon === null
                        ? 'div'
                        : field.icon.type === 'heroicon'
                        ? HI[field.icon.heroicon]
                        : field.icon.type === 'socials'
                        ? SocialIcons[field.icon.name]
                        : field.icon.type === 'image'
                        ? function ImageIcon(props: React.ComponentProps<'img'>) {
                            // @ts-expect-error
                            // eslint-disable-next-line @next/next/no-img-element
                            return <img src={field.icon.imageUrl} alt="" {...props} />
                          }
                        : 'div'

                    return (
                      <tr key={field.id}>
                        <td className="text-center">
                          <Icon className="h-4 w-4 text-gray-500 grayscale" />
                        </td>
                        <td className="px-3">{field.value}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {invoice.account.paymentMethods.length > 0 && (
              <table className="text-sm">
                <thead>
                  <tr>
                    <td colSpan={2} className="text-sm font-medium text-gray-900">
                      {t((x) => x.summary.paymentDetails)}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {invoice.account.paymentMethods.map((paymentMethod) => {
                    return (
                      <tr key={paymentMethod.id}>
                        <td className="text-center">
                          {match(paymentMethod.type, {
                            iban: () => <BanknotesIcon className="h-4 w-4 text-gray-500" />,
                            paypal: () => <PaypalIcon className="h-4 w-4 text-gray-500" />,
                          })}
                        </td>
                        <td className="px-3">{paymentMethod.value}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <Legal className="w-full text-center text-xs" />
      </div>
    </div>
  )
}
