import { Discount } from '~/domain/discount/discount'
import { Invoice } from '~/domain/invoice/invoice'
import { useTranslation } from '~/ui/hooks/use-translation'
import { Markdown } from '~/ui/markdown'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

export function Items({ items, children }: { items: Invoice['items']; children: React.ReactNode }) {
  let containsVat = items.some((item) => {
    return item.taxRate !== null
  })
  let t = useTranslation()

  return (
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="w-full whitespace-nowrap py-3 pl-12 pr-4 text-left text-sm font-medium text-gray-900">
            {t((x) => {
              return x.invoiceItem.description
            })}
          </th>
          <th className="w-full whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-900">
            {t((x) => {
              return x.invoiceItem.quantity
            })}
          </th>
          <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
            {t((x) => {
              return x.invoiceItem.unitPrice
            })}
          </th>
          {containsVat && (
            <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
              {t((x) => {
                return x.invoiceItem.vat
              })}
            </th>
          )}
          <th className="w-full whitespace-nowrap py-3 pl-4 pr-12 text-right text-sm font-medium text-gray-900">
            {t((x) => {
              return x.invoiceItem.subtotal
            })}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx, all) => {
          return (
            <tr
              key={item.id}
              data-first={idx === 0 ? true : undefined}
              data-last={idx === all.length - 1 ? true : undefined}
              className="[--bottom:--py] [--indent:theme(spacing.8)] [--left:--px] [--px:theme(spacing.4)] [--py:theme(spacing[1.5])] [--right:--px] [--top:--py] data-[first]:[--top:theme(spacing.4)] data-[last]:[--bottom:theme(spacing.4)]"
            >
              <td className="whitespace-pre-wrap pb-[--bottom] pl-[calc(var(--indent)+var(--left))] pr-[--right] pt-[--top] text-left align-top text-sm font-medium text-gray-900">
                <Markdown>{item.description}</Markdown>
                <ul className="empty:hidden">
                  {item.discounts.map((discount, idx) => {
                    return (
                      <li
                        key={idx}
                        className="whitespace-nowrap text-left text-sm font-normal text-gray-500"
                      >
                        {t((x) => {
                          return x.summary.discount.title
                        })}
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
                            percentage: () => {
                              return <>{(-1 * (discount.value * 100)).toFixed(0)}%</>
                            },
                          },
                          discount,
                        )}
                      </li>
                    )
                  })}
                </ul>
              </td>
              <td className="whitespace-nowrap pb-[--bottom] pl-[--left] pr-[--right] pt-[--top] text-left align-top text-sm tabular-nums text-gray-500">
                {item.quantity}
              </td>
              <td className="whitespace-nowrap pb-[--bottom] pl-[--left] pr-[--right] pt-[--top] text-right align-top text-sm text-gray-500">
                <Money amount={item.unitPrice} />
              </td>
              {containsVat && (
                <td className="whitespace-nowrap pb-[--bottom] pl-[--left] pr-[--right] pt-[--top] text-right align-top text-sm tabular-nums text-gray-500">
                  {`${((item.taxRate ?? 0) * 100).toFixed(0)}%`}
                </td>
              )}
              <td className="whitespace-nowrap pb-[--bottom] pl-[--left] pr-[calc(var(--indent)+var(--right))] pt-[--top] text-right align-top text-sm font-semibold text-gray-900">
                <Money amount={itemPrice(item)} />
              </td>
            </tr>
          )
        })}
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
