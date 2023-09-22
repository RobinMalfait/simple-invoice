import { Discount } from '~/domain/discount/discount'
import { Invoice } from '~/domain/invoice/invoice'
import { useTranslation } from '~/ui/hooks/use-translation'
import { Markdown } from '~/ui/markdown'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

export function Items({ items, children }: { items: Invoice['items']; children: React.ReactNode }) {
  let containsVat = items.some((item) => item.taxRate !== null)
  let t = useTranslation()

  return (
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="w-full whitespace-nowrap py-3 pl-12 pr-4 text-left text-sm font-medium text-gray-900">
            {t((x) => x.invoiceItem.description)}
          </th>
          <th className="w-full whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-900">
            {t((x) => x.invoiceItem.quantity)}
          </th>
          <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
            {t((x) => x.invoiceItem.unitPrice)}
          </th>
          {containsVat && (
            <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
              {t((x) => x.invoiceItem.vat)}
            </th>
          )}
          <th className="w-full whitespace-nowrap py-3 pl-4 pr-12 text-right text-sm font-medium text-gray-900">
            {t((x) => x.invoiceItem.subtotal)}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td className="whitespace-pre-wrap py-4 pl-12 pr-4 text-left align-top text-sm font-medium text-gray-900">
              <Markdown>{item.description}</Markdown>
              <ul className="empty:hidden">
                {item.discounts.map((discount, idx) => (
                  <li
                    key={idx}
                    className="whitespace-nowrap text-left text-sm font-normal text-gray-500"
                  >
                    {t((x) => x.summary.discount.title)}
                    {discount.reason && (
                      <>
                        <span className="px-1">
                          (
                          <span className="text-xs font-medium text-gray-400">
                            {discount.reason}
                          </span>
                          )
                        </span>
                      </>
                    )}
                    <span className="px-3 text-gray-400">/</span>
                    {match(
                      discount.type,
                      {
                        fixed: (discount: Extract<Discount, { type: 'fixed' }>) => {
                          if (discount.quantity === 1) {
                            return <Money amount={-1 * discount.value} />
                          }

                          return (
                            <span>
                              <Money amount={-1 * discount.value} />
                              <span className="px-1">&times;</span>
                              {discount.quantity}
                            </span>
                          )
                        },
                        percentage: () => <>{(-1 * (discount.value * 100)).toFixed(0)}%</>,
                      },
                      discount,
                    )}
                  </li>
                ))}
              </ul>
            </td>
            <td className="whitespace-nowrap p-4 text-left align-top text-sm tabular-nums text-gray-500">
              {item.quantity}
            </td>
            <td className="whitespace-nowrap p-4 text-right align-top text-sm text-gray-500">
              <Money amount={item.unitPrice} />
            </td>
            {containsVat && (
              <td className="whitespace-nowrap p-4 text-right align-top text-sm tabular-nums text-gray-500">
                {`${((item.taxRate ?? 0) * 100).toFixed(0)}%`}
              </td>
            )}
            <td className="whitespace-nowrap py-4 pl-4 pr-12 text-right align-top text-sm font-semibold text-gray-900">
              <Money amount={itemPrice(item)} />
            </td>
          </tr>
        ))}
        {children}
      </tbody>
    </table>
  )
}

function itemPrice(item: Invoice['items'][number]) {
  let net = item.unitPrice * item.quantity
  for (let discount of item.discounts) {
    if (discount.type === 'percentage') {
      net -= net * discount.value
    } else if (discount.type === 'fixed') {
      net -= discount.value * discount.quantity
    }
  }
  return net
}
