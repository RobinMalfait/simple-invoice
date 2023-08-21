import type { Event } from '~/domain/events/event'
import { Invoice } from '~/domain/invoice/invoice'
import { summary } from '~/domain/invoice/summary'

export function total(invoice: Pick<Invoice, 'items' | 'discounts'>) {
  let total = summary(invoice).find((s) => s.type === 'total')! as Extract<
    ReturnType<typeof summary>[number],
    { type: 'total' }
  >
  return total.value
}

export function totalUnpaid(invoice: Pick<Invoice, 'items' | 'events' | 'discounts'>) {
  let partiallyPaidEvent = (invoice.events
    .slice()
    .reverse()
    .find((e) => e.type === 'invoice-partially-paid') ?? null) as Extract<
    Event,
    { type: 'invoice-partially-paid' }
  > | null

  if (partiallyPaidEvent) {
    return partiallyPaidEvent.outstanding
  }

  return total(invoice)
}
