import { Invoice } from '~/domain/invoice/invoice'
import { groupVat } from '~/ui/invoice/taxes'
import { total, TotalFeatures } from '~/ui/invoice/total'
import { Money } from '~/ui/money'

export function Summary({
  items,
  type = 'all',
}: {
  items: Invoice['items']
  type: 'all' | 'subtotal'
}) {
  if (items.length === 0) {
    return null
  }

  let vats = groupVat(items)

  return (
    <>
      <tr>
        <td></td>
        <td colSpan={4} className="pb-3 pl-4 pr-12">
          <div className="h-1 w-full rounded-full bg-gray-50"></div>
        </td>
      </tr>

      {items.length > 0 && (
        <tr>
          <td />
          <th
            colSpan={2}
            className="whitespace-nowrap px-4 py-3 text-left text-sm font-normal text-gray-500"
          >
            Subtotaal
          </th>
          <td
            colSpan={2}
            className="whitespace-nowrap px-4 py-3 pl-4 pr-12 text-right align-top text-sm text-gray-500"
          >
            <Money amount={total(items)} />
          </td>
        </tr>
      )}
      {type === 'all' &&
        vats.map(({ total, vat }) => (
          <tr key={vat}>
            <td />
            <th
              colSpan={2}
              className="whitespace-nowrap px-4 py-3 text-left text-sm font-normal text-gray-500"
            >
              {`BTW (${(vat * 100).toFixed(0)}%)`}
            </th>
            <td
              colSpan={2}
              className="whitespace-nowrap px-4 py-3 pl-4 pr-12 text-right align-top text-sm text-gray-500"
            >
              <Money amount={total} />
            </td>
          </tr>
        ))}
      {type === 'all' && (vats.length > 0 || items.length > 0) && (
        <tr>
          <td />
          <th
            colSpan={2}
            className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold text-gray-500"
          >
            Totaal
          </th>
          <td
            colSpan={2}
            className="whitespace-nowrap px-4 py-3 pl-4 pr-12 text-right align-top text-sm font-bold text-gray-500"
          >
            <Money amount={total(items, TotalFeatures.IncludingVAT)} />
          </td>
        </tr>
      )}

      <tr>
        <td className="py-2" />
      </tr>
    </>
  )
}
