import { Discount } from '~/domain/discount/discount'
import { Invoice } from '~/domain/invoice/invoice'
import { InvoiceStatus } from './invoice-status'

export type Summary =
  | { type: 'subtotal'; subtype?: 'discounts'; value: number }
  | { type: 'discount'; discount: Discount }
  | { type: 'vat'; rate: number; value: number }
  | { type: 'total'; value: number }
  | { type: 'paid'; value: number }

export function summary({
  items,
  discounts,
  status = null,
}: Pick<Invoice, 'items' | 'discounts'> & { status?: InvoiceStatus | null }): Summary[] {
  let result: Summary[] = []

  let hasDiscounts = discounts.length > 0
  let hasVAT = items.some((item) => item.taxRate !== 0)

  // Calculate net subtotal
  let subtotalResult = items.reduce((sum, item) => {
    let net = item.unitPrice * item.quantity
    for (let discount of item.discounts) {
      if (discount.type === 'percentage') {
        net -= net * discount.value
      } else if (discount.type === 'fixed') {
        net -= discount.value * discount.quantity
      }
    }
    return sum + net
  }, 0)
  if (hasDiscounts || hasVAT) {
    result.push({ type: 'subtotal', value: subtotalResult })
  }

  // Calculate discounts
  let discountResult = 0
  for (let discount of discounts) {
    result.push({ type: 'discount', discount })

    if (discount.type === 'percentage') {
      let value = subtotalResult * discount.value
      discountResult += value
      subtotalResult -= value
    }

    //
    else if (discount.type === 'fixed') {
      let value = discount.value * discount.quantity
      discountResult += value
      subtotalResult -= value
    }
  }

  let isSingleFixedDiscount = discounts.length === 1 && discounts[0].type === 'fixed'

  if (discounts.length > 0 && !isSingleFixedDiscount) {
    result.push({ type: 'subtotal', subtype: 'discounts', value: discountResult })
  }

  // Calculate VATs
  let vatTypes = new Set(items.map((item) => item.taxRate)).size

  let vats = new Map<number, number>()
  let vatResult = 0

  // Only dealing with a single VAT rate
  if (vatTypes === 1 && items[0].taxRate !== 0) {
    let taxRate = items[0].taxRate
    let value = subtotalResult * taxRate

    vats.set(taxRate, value)
    vatResult += value
  }

  // Dealing with multiple VAT rates (this is currently not supported in combination with discounts)
  else {
    for (let item of items) {
      if (item.taxRate === 0) continue
      if (!vats.has(item.taxRate)) vats.set(item.taxRate, 0)

      let value = item.unitPrice * item.quantity * item.taxRate
      vats.set(item.taxRate, (vats.get(item.taxRate) ?? 0) + value)
      vatResult += value
    }
  }

  if (vatResult > 0 && discountResult > 0) {
    result.push({ type: 'subtotal', value: subtotalResult })
  }

  for (let [taxRate, value] of vats.entries()) {
    result.push({ type: 'vat', rate: taxRate, value: value })
  }

  // Calculate total
  result.push({ type: 'total', value: subtotalResult + vatResult })

  if (status === InvoiceStatus.Paid) {
    result.push({ type: 'paid', value: subtotalResult + vatResult })
  }

  return result
}
