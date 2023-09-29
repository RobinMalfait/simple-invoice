import { Discount } from '~/domain/discount/discount'
import { Invoice } from '~/domain/invoice/invoice'
import { summary, Summary } from '~/domain/invoice/summary'
import { useTranslation } from '~/ui/hooks/use-translation'
import { Money } from '~/ui/money'
import { match } from '~/utils/match'

let summaryItems: {
  [P in Summary['type']]: (
    item: Extract<Summary, { type: P }>,
    ctx: { t: ReturnType<typeof useTranslation> },
  ) => [React.ReactNode, React.ReactNode]
} = {
  subtotal: (item, { t }) => {
    return [
      <>
        {item.subtype === 'discounts'
          ? t((x) => x.summary.discount.total)
          : t((x) => x.summary.subtotal)}
      </>,
      <>
        <Money amount={item.value} />
      </>,
    ]
  },
  total: (item, { t }) => {
    return [
      <>
        <span className="font-bold">{t((x) => x.summary.total)}</span>
      </>,
      <>
        <span className="font-bold">
          <Money amount={item.value} />
        </span>
      </>,
    ]
  },
  paid: (item, { t }) => {
    return [
      <>
        <span className="font-bold">{t((x) => x.summary.paid)}</span>
      </>,
      <>
        <span className="font-bold">
          <Money amount={item.value} />
        </span>
      </>,
    ]
  },
  vat: (item, { t }) => {
    return [
      <>
        {t((x) => x.summary.vat, {
          rate: `${(item.rate * 100).toFixed(0)}%`,
        })}
      </>,
      <>
        <Money amount={item.value} />
      </>,
    ]
  },
  discount: (item, { t }) => {
    return [
      <>
        {t((x) => x.summary.discount.title)}
        {item.discount.reason && (
          <>
            <span className="px-1">
              (<span className="text-xs font-medium text-gray-400">{item.discount.reason}</span>)
            </span>
          </>
        )}
        {item.discount.type === 'fixed' && item.discount.quantity !== 1 && (
          <span>&times; {item.discount.quantity}</span>
        )}
      </>,
      <>
        {match(
          item.discount.type,
          {
            fixed: (discount: Extract<Discount, { type: 'fixed' }>) => (
              <Money amount={-1 * discount.value * discount.quantity} />
            ),
            percentage: () => <>{(-1 * (item.discount.value * 100)).toFixed(0)}%</>,
          },
          item.discount,
        )}
      </>,
    ]
  },
}

export function Summary({
  items,
  discounts,
  status,
  type = 'all',
}: {
  items: Invoice['items']
  discounts: Invoice['discounts']
  status: Invoice['status'] | null
  type: 'all' | 'subtotal'
}) {
  let t = useTranslation()
  if (items.length === 0) return null
  let summaryInfo = summary({ items, discounts, status })

  return (
    <>
      <tr>
        <td></td>
        <td colSpan={4} className="pb-3 pl-4 pr-12">
          <div className="h-1 w-full rounded-full bg-gray-50 group-first-of-type:hidden"></div>
        </td>
      </tr>
      {summaryInfo
        .filter(type === 'subtotal' ? (summaryItem) => summaryItem.type === 'subtotal' : () => true)
        .map((summaryItem, idx) => {
          // @ts-ignore
          let [label, value] = summaryItems[summaryItem.type](summaryItem, { t })
          return (
            <tr key={idx}>
              <td />
              <th
                colSpan={2}
                className="whitespace-nowrap px-4 py-1 text-left text-sm font-normal text-gray-500"
              >
                {label}
              </th>
              <td
                colSpan={2}
                className="whitespace-nowrap px-4 py-1 pl-4 pr-12 text-right align-top text-sm text-gray-500"
              >
                {value}
              </td>
            </tr>
          )
        })}

      <tr>
        <td className="py-1" />
      </tr>
    </>
  )
}
