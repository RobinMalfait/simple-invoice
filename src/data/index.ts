import { Account } from '~/domain/account/account'
import { isInvoice, isQuote, isReceipt } from '~/domain/record/filters'
import type { Record } from '~/domain/record/record'

let data = require(`./${process.env.DATA_SOURCE_FILE}.ts`)

function flattenRecords(records: Record[], depth = 0) {
  let result = records.flatMap((record) => {
    let list = [record]

    //
    if (isQuote(record)) {
      if (record.quote) {
        list.push(...flattenRecords([record.quote], depth + 1))
      }
    }

    //
    else if (isInvoice(record)) {
      if (record.quote) {
        list.push(...flattenRecords([record.quote], depth + 1))
      }
    }

    //
    else if (isReceipt(record)) {
      if (record.invoice) {
        list.push(...flattenRecords([record.invoice], depth + 1))
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
        .filter((record, idx, all) => all.findIndex((other) => other.id === record.id) === idx)
    )
  }

  return result
}

export let me: Account = data.me
export let records: Record[] = flattenRecords(data.records)

// For each record in the system, we should be able to find all related records in either layers
// below or layers above.
export let stacks: { [id: string]: string[] } = {}

for (let record of records) {
  stacks[record.id] ??= [record.id]

  let records = flattenRecords([record])

  for (let record of records) {
    for (let other of records) {
      if (record === other) continue

      stacks[record.id] ??= [record.id]
      stacks[record.id].push(other.id)

      stacks[other.id] ??= [other.id]
      stacks[other.id].push(record.id)
    }
  }
}

for (let [idx, stack] of Object.entries(stacks)) {
  stacks[idx] = Array.from(new Set(stack))
}

let order = ['quote', 'invoice', 'receipt']
for (let stack of Object.values(stacks)) {
  stack.sort((aId, zId) => {
    let a = records.find((e) => e.id === aId)!
    let z = records.find((e) => e.id === zId)!

    return order.indexOf(a.type) - order.indexOf(z.type) || a.number.localeCompare(z.number)
  })
}
