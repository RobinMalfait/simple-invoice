import { differenceInSeconds } from 'date-fns'
import * as lazy from 'lazy-collections'
import EventEmitter from 'node:events'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Event } from '~/domain/events/event'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { DefaultMap } from '~/utils/default-map'
import { QuoteStatus } from '../quote/quote-status'

export function trackMilestones(bus: EventEmitter) {
  fastestAcceptedQuoteMilestones(bus)
  invoiceCountMilestones(bus)
  fastestPaidInvoiceMilestones(bus)
  revenueMilestones(bus)
  clientCountMilestones(bus)
  mostExpensiveInvoiceMilestones(bus)
}

// ---

type InvoiceEvent = {
  client: Client
  account: Account
  invoice: {
    events: Event[]
    number: string
    total: number
  }
  status: InvoiceStatus
  at: Date
}

type QuoteEvent = {
  client: Client
  account: Account
  quote: {
    events: Event[]
    number: string
    total: number
  }
  status: QuoteStatus
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

function milestones<T>(arr: T[], condition: (t: T) => boolean): T[] {
  let idx = arr.findIndex(condition)
  if (idx === -1) return []
  return arr.splice(idx).splice(0, 1)
}

function initState<T>(cb: () => T) {
  return new DefaultMap(() => ({
    pending: cb(),
    paid: cb(),
  }))
}

export function fastestAcceptedQuoteMilestones(bus: EventEmitter) {
  const MILESTONE = 'milestone:fastest-accepted-quote'

  let stateByAccount = new DefaultMap(() => ({
    sentAt: new Map<string, Date>(),
    max: null as number | null,
  }))

  bus.on('quote:sent', (e: QuoteEvent) => {
    let state = stateByAccount.get(e.account.id)!

    state.sentAt.set(e.quote.number, e.at)
  })

  bus.on('quote:accepted', (e: QuoteEvent) => {
    let state = stateByAccount.get(e.account.id)!

    let duration = differenceInSeconds(e.at, state.sentAt.get(e.quote.number)!)

    if (state.max === null) {
      state.max = duration
      return
    }

    if (duration >= state.max) {
      state.sentAt.delete(e.quote.number)
      return
    }

    state.max = duration

    let event = Event.parse({
      type: MILESTONE,
      quote: e.quote.number,
      client: {
        id: e.client.id,
        name: e.client.name,
      },
      durationInSeconds: duration,
      at: e.at,
    })

    e.account.events.push(event)
    e.client.events.push(event)
    e.quote.events.push(event)
  })
}

export function invoiceCountMilestones(bus: EventEmitter) {
  const MILESTONE = 'milestone:invoices'

  let stateByAccount = initState(() => ({
    milestones: [1000, 750, 500, 300, 200, 150, 100, 50, 25, 10, 5, 1],
    count: new Set<string>(),
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let { pending, paid } = stateByAccount.get(e.account.id)!

    pending.count.add(e.invoice.number)

    for (let milestone of milestones(
      pending.milestones,
      (m) => m <= paid.count.size + pending.count.size,
    )) {
      e.account.events.push(Event.parse({ type: MILESTONE, amount: milestone, future: true }))
    }
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let { pending, paid } = stateByAccount.get(e.account.id)!

    pending.count.delete(e.invoice.number)
    paid.count.add(e.invoice.number)

    for (let milestone of milestones(paid.milestones, (m) => m <= paid.count.size)) {
      e.account.events.push(Event.parse({ type: MILESTONE, amount: milestone, at: e.at }))
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed']) {
    bus.on(status, (e: InvoiceEvent) => {
      let { pending, paid } = stateByAccount.get(e.account.id)!
      pending.count.delete(e.invoice.number)

      let amount = paid.count.size + pending.count.size

      e.account.events = e.account.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= amount),
      )
    })
  }
}

export function fastestPaidInvoiceMilestones(bus: EventEmitter) {
  const MILESTONE = 'milestone:fastest-paid-invoice'

  let stateByAccount = new DefaultMap(() => ({
    sentAt: new Map<string, Date>(),
    max: null as number | null,
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    state.sentAt.set(e.invoice.number, e.at)
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let state = stateByAccount.get(e.account.id)!

    if (!state.sentAt.has(e.invoice.number)) {
      return
    }

    let duration = differenceInSeconds(e.at, state.sentAt.get(e.invoice.number)!)

    if (state.max === null) {
      state.max = duration
      return
    }

    if (duration >= state.max) {
      state.sentAt.delete(e.invoice.number)
      return
    }

    state.max = duration

    let event = Event.parse({
      type: MILESTONE,
      invoice: e.invoice.number,
      client: {
        id: e.client.id,
        name: e.client.name,
      },
      durationInSeconds: duration,
      at: e.at,
    })

    e.account.events.push(event)
    e.client.events.push(event)
    e.invoice.events.push(event)
  })
}

export function clientCountMilestones(bus: EventEmitter) {
  const MILESTONE = 'milestone:clients'

  let stateByAccount = initState(() => ({
    milestones: [100, 75, 50, 25, 10, 5, 3],
    clientByInvoice: new Map<string, string>(),
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let { pending, paid } = stateByAccount.get(e.account.id)!

    pending.clientByInvoice.set(e.invoice.number, e.client.id)

    let total = lazy.pipe(
      lazy.concat(pending.clientByInvoice.values(), paid.clientByInvoice.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    for (let milestone of milestones(pending.milestones, (m) => m <= total)) {
      e.account.events.push(Event.parse({ type: MILESTONE, amount: milestone, future: true }))
    }
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let { pending, paid } = stateByAccount.get(e.account.id)!

    pending.clientByInvoice.delete(e.invoice.number)
    paid.clientByInvoice.set(e.invoice.number, e.client.id)

    let total = lazy.pipe(
      lazy.concat(paid.clientByInvoice.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    for (let milestone of milestones(paid.milestones, (m) => m <= total)) {
      e.account.events.push(Event.parse({ type: MILESTONE, amount: milestone, at: e.at }))
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed']) {
    bus.on(status, (e: InvoiceEvent) => {
      let { pending, paid } = stateByAccount.get(e.account.id)!

      pending.clientByInvoice.delete(e.invoice.number)

      let total = lazy.pipe(
        lazy.concat(paid.clientByInvoice.values()),
        lazy.unique(),
        lazy.toLength(),
      )()

      e.account.events = e.account.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= total),
      )
    })
  }
}

export function revenueMilestones(bus: EventEmitter) {
  const MILESTONE = 'milestone:revenue'

  let stateByAccount = initState(() => ({
    milestones: [
      10_000_000_00, 5_000_000_00, 1_500_000_00, 1_000_000_00, 750_000_00, 500_000_00, 250_000_00,
      100_000_00, 50_000_00, 10_000_00, 5_000_00, 1_000_00, 500_00, 100_00,
    ],
    totalByInvoice: new Map<string, number>(),
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let { pending, paid } = stateByAccount.get(e.account.id)!

    pending.totalByInvoice.set(e.invoice.number, e.invoice.total)

    let total = sum(pending.totalByInvoice.values(), paid.totalByInvoice.values())

    for (let milestone of milestones(pending.milestones, (m) => m <= total)) {
      e.account.events.push(
        Event.parse({ type: MILESTONE, amount: total, milestone, future: true }),
      )
    }
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let { pending, paid } = stateByAccount.get(e.account.id)!

    pending.totalByInvoice.delete(e.invoice.number)
    paid.totalByInvoice.set(e.invoice.number, e.invoice.total)

    let total = sum(paid.totalByInvoice.values())

    for (let milestone of milestones(paid.milestones, (m) => m <= total)) {
      e.account.events.push(Event.parse({ type: MILESTONE, amount: total, milestone, at: e.at }))
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed']) {
    bus.on(status, (e: InvoiceEvent) => {
      let { pending, paid } = stateByAccount.get(e.account.id)!
      pending.totalByInvoice.delete(e.invoice.number)

      let total = sum(pending.totalByInvoice.values(), paid.totalByInvoice.values())

      e.account.events = e.account.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= total),
      )
    })
  }
}

export function mostExpensiveInvoiceMilestones(bus: EventEmitter) {
  const MILESTONE = 'milestone:most-expensive-invoice'

  let stateByAccount = initState(() => ({
    max: null as number | null,
  }))

  bus.on('invoice:sent', (e: InvoiceEvent) => {
    let { pending, paid } = stateByAccount.get(e.account.id)!

    if (pending.max === null) {
      pending.max = e.invoice.total
      return
    }

    if (e.invoice.total <= Math.max(pending.max, paid.max ?? 0)) {
      return
    }

    let previous = pending.max
    pending.max = e.invoice.total

    let event = Event.parse({
      type: MILESTONE,
      invoice: e.invoice.number,
      amount: e.invoice.total,
      increase: Number(((e.invoice.total / previous - 1) * 100).toFixed(0)),
      future: true,
      best: true,
    })
    e.account.events.push(event)
    e.client.events.push(event)
    e.invoice.events.push(event)
  })

  bus.on('invoice:paid', (e: InvoiceEvent) => {
    let { paid } = stateByAccount.get(e.account.id)!

    if (paid.max === null) {
      paid.max = e.invoice.total
      return
    }

    if (e.invoice.total <= paid.max) {
      return
    }

    let previous = paid.max
    paid.max = e.invoice.total

    let event = Event.parse({
      type: MILESTONE,
      invoice: e.invoice.number,
      amount: e.invoice.total,
      increase: Number(((e.invoice.total / previous - 1) * 100).toFixed(0)),
      at: e.at,
      best: true,
    }) as Extract<Event, typeof MILESTONE>

    for (let ev of lazy.pipe(
      lazy.concat(e.account.events, e.client.events, e.invoice.events),
      lazy.filter((e: Event) => e.type === MILESTONE),
    )()) {
      ev.best = false
    }

    e.account.events.push(event)
    e.client.events.push(event)
    e.invoice.events.push(event)
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed']) {
    bus.on(status, (e: InvoiceEvent) => {
      let { paid } = stateByAccount.get(e.account.id)!

      e.account.events = e.account.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= paid.max!),
      )
      e.client.events = e.client.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= paid.max!),
      )
      e.invoice.events = e.invoice.events.filter(
        (e) => !(e.type === MILESTONE && e.future && e.amount <= paid.max!),
      )
    })
  }
}
