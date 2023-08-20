import { Account } from '~/domain/account/account'
import { isInvoice, isQuote, isReceipt } from '~/domain/entity-filters'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'

type Entity = Quote | Invoice | Receipt

let data = require(`./${process.env.DATA_SOURCE_FILE}.ts`)

function flattenEntities(entities: Entity[], depth = 0) {
  let result = entities.flatMap((entity) => {
    let list = [entity]

    //
    if (isQuote(entity)) {
      if (entity.quote) {
        list.push(...flattenEntities([entity.quote], depth + 1))
      }
    }

    //
    else if (isInvoice(entity)) {
      if (entity.quote) {
        list.push(...flattenEntities([entity.quote], depth + 1))
      }
    }

    //
    else if (isReceipt(entity)) {
      if (entity.invoice) {
        list.push(...flattenEntities([entity.invoice], depth + 1))
      }
    }

    return list.filter(Boolean)
  })

  if (depth === 0) {
    return (
      Array.from(
        // Make unique using identity
        new Set(result),
      )
        // Make unique using ID
        .filter((entity, idx, all) => all.findIndex((other) => other.id === entity.id) === idx)
    )
  }

  return result
}

export let me: Account = data.me
export let invoices: Entity[] = flattenEntities(data.invoices)

// For each entity in the system, we should be able to find all related entities in either layers
// below or layers above.
export let stacks: Record<string, string[]> = {}

for (let entity of invoices) {
  stacks[entity.id] ??= [entity.id]

  let entities = flattenEntities([entity])

  for (let entity of entities) {
    for (let other of entities) {
      if (entity === other) continue

      stacks[entity.id] ??= [entity.id]
      stacks[entity.id].push(other.id)

      stacks[other.id] ??= [other.id]
      stacks[other.id].push(entity.id)
    }
  }
}

for (let [idx, stack] of Object.entries(stacks)) {
  stacks[idx] = Array.from(new Set(stack))
}

let order = ['quote', 'invoice', 'receipt']
for (let stack of Object.values(stacks)) {
  stack.sort((aId, zId) => {
    let a = invoices.find((e) => e.id === aId)!
    let z = invoices.find((e) => e.id === zId)!

    return order.indexOf(a.type) - order.indexOf(z.type) || a.number.localeCompare(z.number)
  })
}
