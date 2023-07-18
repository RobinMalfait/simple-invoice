import { Invoice } from '~/domain/invoice/invoice'

export enum TotalFeatures {
  None = 1 << 0,
  IncludingVAT = 1 << 1,
}

export function total(items: Invoice['items'], features: TotalFeatures = TotalFeatures.None) {
  return items.reduce((sum, item) => {
    let subtotal = item.unitPrice * item.quantity

    if ((features & TotalFeatures.IncludingVAT) === TotalFeatures.IncludingVAT) {
      subtotal *= 1 + item.taxRate
    }

    return sum + subtotal
  }, 0)
}
