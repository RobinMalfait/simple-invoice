import { InvoiceItem } from '~/domain/invoice/invoice-item'

export function groupVat(items: InvoiceItem[]) {
  return Object.values<{ total: number; vat: number }>(
    items.reduce((grouped: Record<number, { total: number; vat: number }>, item) => {
      grouped[item.taxRate] = grouped[item.taxRate] || { total: 0, vat: item.taxRate }
      grouped[item.taxRate].total += item.unitPrice * item.quantity * item.taxRate
      return grouped
    }, {}),
  )
    .filter(({ total }) => total)
    .sort((a, z) => a.vat - z.vat)
}
