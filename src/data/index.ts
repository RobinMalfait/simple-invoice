import { compareAsc } from 'date-fns'
import { Account } from '~/domain/account/account'
import { isInvoice, isQuote, isReceipt } from '~/domain/entity-filters'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { resolveRelevantEntityDate } from '~/domain/relevant-entity-date'

type Entity = Quote | Invoice | Receipt

let data = require(`./${process.env.DATA_SOURCE_FILE}.ts`)

export let me: Account = data.me
export let invoices: Entity[] = (
  Array.from(
    new Set( // Make unique using identity
      data.invoices.flatMap((entity: Entity) => {
        if (isQuote(entity)) {
          return [entity]
        } else if (isInvoice(entity)) {
          return [entity, entity.quote].filter(Boolean)
        } else if (isReceipt(entity)) {
          return [entity, entity.invoice, entity.invoice.quote].filter(Boolean)
        }
      }),
    ),
  ) as Entity[]
)
  // Make unique using ID
  .filter((entity, idx, all) => all.findIndex((other) => other.id === entity.id) === idx)

// For each entity in the system, we should be able to find all related entities in either layers
// below or layers above.
export let stacks: Map<string, string[]> = new Map(
  invoices.map((entity) => [entity.id, [entity.id]]),
)

for (let entity of invoices) {
  if (isInvoice(entity)) {
    if (entity.quote) {
      stacks.get(entity.id)!.push(entity.quote.id)
      stacks.get(entity.quote.id)!.push(entity.id)
    }
  }

  if (isReceipt(entity)) {
    if (entity.invoice) {
      stacks.get(entity.id)!.push(entity.invoice.id)
      stacks.get(entity.invoice.id)!.push(entity.id)
    }

    if (entity.invoice?.quote) {
      stacks.get(entity.id)!.push(entity.invoice.quote.id)
      stacks.get(entity.invoice.quote.id)!.push(entity.id)
    }
  }
}

for (let stack of stacks.values()) {
  stack.sort((aId, zId) => {
    let a = invoices.find((e) => e.id === aId)!
    let z = invoices.find((e) => e.id === zId)!

    return (
      compareAsc(resolveRelevantEntityDate(a), resolveRelevantEntityDate(z)) ||
      a.number.localeCompare(z.number)
    )
  })
}
