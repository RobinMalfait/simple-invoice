import { Invoice } from '~/domain/invoice/invoice'
import { summary } from '~/domain/invoice/summary'

export function total(invoice: Pick<Invoice, 'items' | 'discounts'>) {
  let total = summary(invoice).find((s) => s.type === 'total')! as Extract<
    ReturnType<typeof summary>[number],
    { type: 'total' }
  >
  return total.value
}
