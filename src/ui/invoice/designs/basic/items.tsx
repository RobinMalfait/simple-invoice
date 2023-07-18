import { Invoice } from '~/domain/invoice/invoice'
import { Money } from '~/ui/money'

export function Items({ items, children }: { items: Invoice['items']; children: React.ReactNode }) {
  let containsVat = items.some((item) => item.taxRate > 0)

  return (
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="w-full whitespace-nowrap py-3 pl-12 pr-4 text-left text-sm font-medium text-gray-900 ">
            Beschrijving
          </th>
          <th className="w-full whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-900">
            Aantal
          </th>
          <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
            Eenheidsprijs
          </th>
          {containsVat && (
            <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
              BTW
            </th>
          )}
          <th className="w-full whitespace-nowrap py-3 pl-4 pr-12 text-right text-sm font-medium text-gray-900 ">
            Subtotaal
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td className="whitespace-pre-wrap py-4 pl-12 pr-4 text-left align-top text-sm font-medium text-gray-900">
              {item.description}
            </td>
            <td className="whitespace-nowrap p-4 text-left align-top text-sm tabular-nums text-gray-500">
              {item.quantity}
            </td>
            <td className="whitespace-nowrap p-4 text-right align-top text-sm text-gray-500">
              <Money amount={item.unitPrice} />
            </td>
            {containsVat && (
              <td className="whitespace-nowrap p-4 text-right align-top text-sm tabular-nums text-gray-500">
                {`${(item.taxRate * 100).toFixed(0)}%`}
              </td>
            )}
            <td className="whitespace-nowrap py-4 pl-4 pr-12 text-right align-top text-sm font-semibold text-gray-900">
              <Money amount={item.unitPrice * item.quantity} />
            </td>
          </tr>
        ))}
        {children}
      </tbody>
    </table>
  )
}
