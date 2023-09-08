import * as lazy from 'lazy-collections'
import EventEmitter from 'node:events'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Event } from '~/domain/events/event'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { DefaultMap } from '~/utils/default-map'

export function trackMilestones(bus: EventEmitter) {
  invoiceCountMilestones(bus)
  revenueMilestones(bus)
  clientCountMilestones(bus)
  mostExpensiveInvoiceMilestones(bus)
}

// ---

type InvoiceEvent = {
  client: Client
  account: Account
  invoice: {
    number: string
    total: number
  }
  status: InvoiceStatus
  at: Date
}

function sum(...streams: Iterable<number>[]) {
  let total = 0
  for (let stream of streams) {
    for (let value of stream) {
      total += value
    }
  }
  return total
}

function invoiceCountMilestones(bus: EventEmitter) {
  const MILESTONE = 'account-milestone:invoices'

  let stateByAccount = new DefaultMap(() => ({
    pendingMilestones: [1000, 750, 500, 300, 200, 150, 100, 50, 25, 10, 5, 1],
    pending: new Set<string>(),
    paid: new Set<string>(),
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    state.pending.add(e.invoice.number)

    let idx = state.pendingMilestones.findIndex((m) => m <= state.paid.size + state.pending.size)
    if (idx === -1) return
    let milestone = state.pendingMilestones[idx]

    e.account.events.push(Event.parse({ type: MILESTONE, amount: milestone, future: true }))
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    state.pending.delete(e.invoice.number)
    state.paid.add(e.invoice.number)

    let idx = state.pendingMilestones.findIndex((m) => m <= state.paid.size)
    if (idx === -1) return
    let milestone = state.pendingMilestones[idx]

    state.pendingMilestones.splice(idx)

    e.account.events.push(Event.parse({ type: MILESTONE, amount: milestone, at: e.at }))
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed']) {
    bus.on(status, (e: InvoiceEvent) => {
      let state = stateByAccount.get(e.account.id)!
      state.pending.delete(e.invoice.number)

      let amount = state.paid.size + state.pending.size

      e.account.events = e.account.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= amount),
      )
    })
  }
}

function clientCountMilestones(bus: EventEmitter) {
  const MILESTONE = 'account-milestone:clients'

  let stateByAccount = new DefaultMap(() => ({
    pendingMilestones: [100, 75, 50, 25, 10, 5, 3],
    pending: new Map<string, string>(),
    paid: new Map<string, string>(),
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    state.pending.set(e.invoice.number, e.client.id)

    let total = lazy.pipe(
      lazy.concat(state.pending.values(), state.paid.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    let idx = state.pendingMilestones.findIndex((m) => m <= total)
    if (idx === -1) return
    let milestone = state.pendingMilestones[idx]

    e.account.events.push(Event.parse({ type: MILESTONE, amount: milestone, future: true }))
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    state.pending.delete(e.invoice.number)
    state.paid.set(e.invoice.number, e.client.id)

    let total = lazy.pipe(lazy.concat(state.paid.values()), lazy.unique(), lazy.toLength())()

    let idx = state.pendingMilestones.findIndex((m) => m <= total)
    if (idx === -1) return
    let milestone = state.pendingMilestones[idx]

    state.pendingMilestones.splice(idx)

    e.account.events.push(Event.parse({ type: MILESTONE, amount: milestone, at: e.at }))
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed']) {
    bus.on(status, (e: InvoiceEvent) => {
      let state = stateByAccount.get(e.account.id)!

      state.pending.delete(e.invoice.number)

      let total = lazy.pipe(lazy.concat(state.paid.values()), lazy.unique(), lazy.toLength())()

      e.account.events = e.account.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= total),
      )
    })
  }
}

function revenueMilestones(bus: EventEmitter) {
  const MILESTONE = 'account-milestone:revenue'

  let stateByAccount = new DefaultMap(() => ({
    pendingMilestones: [
      10_000_000_00, 5_000_000_00, 1_500_000_00, 1_000_000_00, 750_000_00, 500_000_00, 250_000_00,
      100_000_00, 50_000_00, 10_000_00, 5_000_00, 1_000_00,
    ],
    pending: new DefaultMap(() => 0),
    paid: new DefaultMap(() => 0),
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    state.pending.set(e.invoice.number, e.invoice.total)

    let total = sum(state.pending.values(), state.paid.values())

    let idx = state.pendingMilestones.findIndex((m) => m <= total)
    if (idx === -1) return
    let milestone = state.pendingMilestones[idx]

    e.account.events.push(Event.parse({ type: MILESTONE, amount: total, milestone, future: true }))
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    state.pending.delete(e.invoice.number)
    state.paid.set(e.invoice.number, e.invoice.total)

    let total = sum(state.paid.values())

    let idx = state.pendingMilestones.findIndex((m) => m <= total)
    if (idx === -1) return
    let milestone = state.pendingMilestones[idx]

    state.pendingMilestones.splice(idx)

    e.account.events.push(Event.parse({ type: MILESTONE, amount: total, milestone, at: e.at }))
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed']) {
    bus.on(status, (e: InvoiceEvent) => {
      let state = stateByAccount.get(e.account.id)!
      state.pending.delete(e.invoice.number)

      let total = sum(state.pending.values(), state.paid.values())

      e.account.events = e.account.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= total),
      )
    })
  }
}

function mostExpensiveInvoiceMilestones(bus: EventEmitter) {
  const MILESTONE = 'account-milestone:most-expensive-invoice'

  let stateByAccount = new DefaultMap(() => ({
    pending: null as number | null,
    paid: null as number | null,
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    if (state.pending === null) {
      state.pending = e.invoice.total
      return
    }

    if (e.invoice.total < state.pending) {
      return
    }

    let previous = state.pending
    state.pending = e.invoice.total

    e.account.events.push(
      Event.parse({
        type: MILESTONE,
        invoice: e.invoice.number,
        amount: e.invoice.total,
        increase: Number(((e.invoice.total / previous - 1) * 100).toFixed(0)),
        future: true,
      }),
    )
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    if (state.paid === null) {
      state.paid = e.invoice.total
      return
    }

    if (e.invoice.total < state.paid) {
      return
    }

    let previous = state.paid
    state.paid = e.invoice.total

    e.account.events.push(
      Event.parse({
        type: MILESTONE,
        invoice: e.invoice.number,
        amount: e.invoice.total,
        increase: Number(((e.invoice.total / previous - 1) * 100).toFixed(0)),
        at: e.at,
      }),
    )
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed']) {
    bus.on(status, (e: InvoiceEvent) => {
      let state = stateByAccount.get(e.account.id)!

      e.account.events = e.account.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= state.paid!),
      )
    })
  }
}
