import { InvoiceItem } from '~/domain/invoice/invoice-item'

export function groupVat(items: InvoiceItem[]) {
  return Object.values<{ total: number; vat: number }>(
    items.reduce((grouped: Record<number, { total: number; vat: number }>, item) => {
      grouped[item.taxRate ?? 0] = grouped[item.taxRate ?? 0] || { total: 0, vat: item.taxRate }
      grouped[item.taxRate ?? 0].total += item.unitPrice * item.quantity * (item.taxRate ?? 0)
      return grouped
    }, {}),
  )
    .filter(({ total }) => total)
    .sort((a, z) => a.vat - z.vat)
}
