import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { bus } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { trackMilestones } from '~/domain/milestone/milestone'
import { separateRecords, type Record } from '~/domain/record/record'
import { env } from '~/utils/env'

export let events: Event[] = []

trackMilestones(bus, { events })

let data = require(
  `./${process.env.NEXT_PUBLIC_DATA_SOURCE_FILE ?? process.env.NEXT_PUBLIC_ENVIRONMENT ?? env.DATA_SOURCE_FILE}.ts`,
)

export let me: Account = data.me
export let records: Record[] = separateRecords(data.records ?? [])
export let clients: Client[] = Array.from(
  new Set(
    ((data.records ?? []) as Record[]).map((e) => {
      return e.client
    }),
  ),
)
  .filter((c, idx, all) => {
    return (
      all.findLastIndex((other) => {
        return other.id === c.id
      }) === idx
    )
  })
  .sort((a, z) => {
    return a.nickname.localeCompare(z.nickname)
  })

// For each record in the system, we should be able to find all related records in either layers
// below or layers above.
export let stacks: { [id: string]: string[] } = {}

for (let record of records) {
  stacks[record.id] ??= [record.id]

  let records = separateRecords([record])

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

let order = ['quote', 'invoice', 'credit-note', 'receipt']
for (let stack of Object.values(stacks)) {
  stack.sort((aId, zId) => {
    let a = records.find((e) => {
      return e.id === aId
    })!
    let z = records.find((e) => {
      return e.id === zId
    })!

    return order.indexOf(a.type) - order.indexOf(z.type) || a.number.localeCompare(z.number)
  })
}
