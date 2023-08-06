import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'

type Entity = Quote | Invoice | Receipt

// We have 1 big list of all the quote, invoices and receipts. However, when we show the overview,
// we only want 1 entity to be present for each invoice. So we squash the list such that only 1
// entity is present instead of 2 or 3 (quote, invoice, receipt).
export function squashEntities(entities: Entity[]): Entity[] {
  let all = entities.slice()
  let toRemove = new Set<string>()

  for (let entity of entities) {
    if (entity.type === 'invoice' && entity.quote) {
      toRemove.add(entity.quote.id)
    } else if (entity.type === 'receipt') {
      toRemove.add(entity.invoice.id)
      if (entity.invoice.quote) toRemove.add(entity.invoice.quote.id)
    }
  }

  for (let entity of toRemove) {
    let idx = all.findIndex((e) => e.id === entity)
    if (idx !== -1) all.splice(idx, 1)
  }

  return all
}
