import { differenceInSeconds } from 'date-fns'
import * as lazy from 'lazy-collections'
import EventEmitter from 'node:events'
import { Event } from '~/domain/events/event'
import { DefaultMap } from '~/utils/default-map'

type Context = {
  events: Event[]
}

export function trackMilestones(bus: EventEmitter, ctx: Context) {
  bus.on('*', (event) => ctx.events.push(event))

  fastestAcceptedQuoteMilestones(bus, ctx)
  invoiceCountMilestones(bus, ctx)
  fastestPaidInvoiceMilestones(bus, ctx)
  revenueMilestones(bus, ctx)
  clientCountMilestones(bus, ctx)
  mostExpensiveInvoiceMilestones(bus, ctx)
}

// ---

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

export function fastestAcceptedQuoteMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:fastest-accepted-quote'

  let stateByAccount = new DefaultMap(() => ({
    events: new Set<Extract<Event, { type: typeof MILESTONE }>>(),
    sentAt: new Map<string, Date>(),
    max: null as number | null,
  }))

  bus.on('quote-sent', (e: Extract<Event, { type: 'quote-sent' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    state.sentAt.set(e.context.quoteId, e.at!)
  })

  bus.on('quote-accepted', (e: Extract<Event, { type: 'quote-accepted' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    let duration = differenceInSeconds(e.at!, state.sentAt.get(e.context.quoteId)!)

    if (state.max === null) {
      state.max = duration
      return
    }

    if (duration >= state.max) {
      state.sentAt.delete(e.context.quoteId)
      return
    }

    state.max = duration

    for (let event of ctx.events.filter(
      (_e) => _e.type === MILESTONE && _e.context.accountId === e.context.accountId,
    ) as Extract<Event, { type: typeof MILESTONE }>[]) {
      event.payload.best = false
    }

    bus.emit(
      MILESTONE,
      Event.parse({
        type: MILESTONE,
        context: {
          accountId: e.context.accountId,
          clientId: e.context.clientId,
        },
        payload: {
          durationInSeconds: duration,
          best: true,
        },
        at: e.at,
      }),
    )
  })
}

export function invoiceCountMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:invoices'

  let stateByAccount = initState(() => ({
    milestones: [1000, 750, 500, 300, 200, 150, 100, 50, 25, 10, 5, 1],
    count: new Set<string>(),
  }))

  bus.on('invoice-sent', (e: Extract<Event, { type: 'invoice-sent' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.count.add(e.context.invoiceId)

    for (let milestone of milestones(
      pending.milestones,
      (m) => m <= paid.count.size + pending.count.size,
    )) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
          },
          payload: {
            amount: milestone,
            future: true,
          },
        }),
      )
    }
  })

  bus.on('invoice-paid', (e: Extract<Event, { type: 'invoice-paid' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.count.delete(e.context.invoiceId)
    paid.count.add(e.context.invoiceId)

    for (let milestone of milestones(paid.milestones, (m) => m <= paid.count.size)) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
            invoiceId: e.context.invoiceId,
          },
          payload: {
            amount: milestone,
            at: e.at,
          },
        }),
      )
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice-paid', 'invoice-closed'] as const) {
    bus.on(status, (e: Extract<Event, { type: typeof status }>) => {
      let { pending, paid } = stateByAccount.get(e.context.accountId)!
      pending.count.delete(e.context.invoiceId)

      let amount = paid.count.size + pending.count.size

      for (let i = ctx.events.length - 1; i >= 0; i--) {
        let event = ctx.events[i]

        if (
          event.type === MILESTONE &&
          event.context.accountId === e.context.accountId &&
          event.payload.future &&
          event.payload.amount <= amount
        ) {
          ctx.events.splice(i, 1)
        }
      }
    })
  }
}

export function fastestPaidInvoiceMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:fastest-paid-invoice'

  let stateByAccount = new DefaultMap(() => ({
    events: new Set<Extract<Event, { type: typeof MILESTONE }>>(),
    sentAt: new Map<string, Date>(),
    max: null as number | null,
  }))

  bus.on('invoice-sent', (e: Extract<Event, { type: 'invoice-sent' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    state.sentAt.set(e.context.invoiceId, e.at!)
  })

  bus.on('invoice-paid', (e: Extract<Event, { type: 'invoice-paid' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    if (!state.sentAt.has(e.context.invoiceId)) {
      return
    }

    let duration = differenceInSeconds(e.at!, state.sentAt.get(e.context.invoiceId)!)

    if (state.max === null) {
      state.max = duration
      return
    }

    if (duration >= state.max) {
      state.sentAt.delete(e.context.invoiceId)
      return
    }

    state.max = duration

    bus.emit(
      MILESTONE,
      Event.parse({
        type: MILESTONE,
        context: {
          accountId: e.context.accountId,
          clientId: e.context.clientId,
          invoiceId: e.context.invoiceId,
        },
        payload: {
          durationInSeconds: duration,
          at: e.at,
          best: true,
        },
      }),
    )

    for (let event of ctx.events.filter(
      (_e) => _e.type === MILESTONE && _e.context.accountId === e.context.accountId,
    ) as Extract<Event, { type: typeof MILESTONE }>[]) {
      event.payload.best = false
    }
  })
}

export function clientCountMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:clients'

  let stateByAccount = initState(() => ({
    milestones: [100, 75, 50, 25, 10, 5, 3],
    clientByInvoice: new Map<string, string>(),
  }))

  bus.on('invoice-sent', (e: Extract<Event, { type: 'invoice-sent' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.clientByInvoice.set(e.context.invoiceId, e.context.clientId)

    let total = lazy.pipe(
      lazy.concat(pending.clientByInvoice.values(), paid.clientByInvoice.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    for (let milestone of milestones(pending.milestones, (m) => m <= total)) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
          },
          payload: {
            amount: milestone,
            future: true,
          },
        }),
      )
    }
  })

  bus.on('invoice-paid', (e: Extract<Event, { type: 'invoice-paid' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.clientByInvoice.delete(e.context.invoiceId)
    paid.clientByInvoice.set(e.context.invoiceId, e.context.clientId)

    let total = lazy.pipe(
      lazy.concat(paid.clientByInvoice.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    for (let milestone of milestones(paid.milestones, (m) => m <= total)) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
          },
          payload: {
            amount: milestone,
            at: e.at,
          },
        }),
      )
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice-paid', 'invoice-closed'] as const) {
    bus.on(status, (e: Extract<Event, { type: typeof status }>) => {
      let { pending, paid } = stateByAccount.get(e.context.accountId)!

      pending.clientByInvoice.delete(e.context.invoiceId)

      let total = lazy.pipe(
        lazy.concat(paid.clientByInvoice.values()),
        lazy.unique(),
        lazy.toLength(),
      )()

      for (let i = ctx.events.length - 1; i >= 0; i--) {
        let event = ctx.events[i]

        if (
          event.type === MILESTONE &&
          event.context.accountId === e.context.accountId &&
          event.payload.future &&
          event.payload.amount <= total
        ) {
          ctx.events.splice(i, 1)
        }
      }
    })
  }
}

export function revenueMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:revenue'

  let stateByAccount = initState(() => ({
    milestones: [
      10_000_000_00, 5_000_000_00, 1_500_000_00, 1_000_000_00, 750_000_00, 500_000_00, 250_000_00,
      100_000_00, 50_000_00, 10_000_00, 5_000_00, 1_000_00, 500_00, 100_00,
    ],
    totalByInvoice: new Map<string, number>(),
  }))

  bus.on('invoice-sent', (e: Extract<Event, { type: 'invoice-sent' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    // TODO: Set total
    {
      let total = 0
      pending.totalByInvoice.set(e.context.invoiceId, total)
    }

    let total = sum(pending.totalByInvoice.values(), paid.totalByInvoice.values())

    for (let milestone of milestones(pending.milestones, (m) => m <= total)) {
      bus.emit(MILESTONE, Event.parse({ type: MILESTONE, amount: total, milestone, future: true }))
    }
  })

  bus.on('invoice-paid', (e: Extract<Event, { type: 'invoice-paid' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.totalByInvoice.delete(e.context.invoiceId)
    // TODO: Set total
    paid.totalByInvoice.set(e.context.invoiceId, 0)

    let total = sum(paid.totalByInvoice.values())

    for (let milestone of milestones(paid.milestones, (m) => m <= total)) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
            invoiceId: e.context.invoiceId,
          },
          payload: {
            amount: total,
            milestone,
            at: e.at,
          },
        }),
      )
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice-paid', 'invoice-closed'] as const) {
    bus.on(status, (e: Extract<Event, { type: typeof status }>) => {
      let { pending, paid } = stateByAccount.get(e.context.accountId)!
      pending.totalByInvoice.delete(e.context.invoiceId)

      let total = sum(pending.totalByInvoice.values(), paid.totalByInvoice.values())

      for (let i = ctx.events.length - 1; i >= 0; i--) {
        let event = ctx.events[i]

        if (
          event.type === MILESTONE &&
          event.context.accountId === e.context.accountId &&
          event.payload.future &&
          event.payload.amount <= total
        ) {
          ctx.events.splice(i, 1)
        }
      }
    })
  }
}

export function mostExpensiveInvoiceMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:most-expensive-invoice'

  let stateByAccount = initState(() => ({
    max: null as number | null,
  }))

  bus.on('invoice-sent', (e: Extract<Event, { type: 'invoice-sent' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    // TODO: Set total
    let total = 0

    if (pending.max === null) {
      pending.max = total
      return
    }

    if (total <= Math.max(pending.max, paid.max ?? 0)) {
      return
    }

    let previous = pending.max
    pending.max = total

    bus.emit(
      MILESTONE,
      Event.parse({
        type: MILESTONE,
        context: {
          accountId: e.context.accountId,
          invoiceId: e.context.invoiceId,
        },
        payload: {
          amount: total,
          increase: Number(((total / previous - 1) * 100).toFixed(0)),
          future: true,
          best: true,
        },
      }),
    )
  })

  bus.on('invoice-paid', (e: Extract<Event, { type: 'invoice-paid' }>) => {
    let { paid } = stateByAccount.get(e.context.accountId)!

    // TODO: Set total
    let total = 0

    if (paid.max === null) {
      paid.max = total
      return
    }

    if (total <= paid.max) {
      return
    }

    let previous = paid.max
    paid.max = total

    bus.emit(
      MILESTONE,
      Event.parse({
        type: MILESTONE,
        context: {
          accountId: e.context.accountId,
          clientId: e.context.clientId,
          invoiceId: e.context.invoiceId,
        },
        payload: {
          amount: total,
          increase: Number(((total / previous - 1) * 100).toFixed(0)),
          at: e.at,
          best: true,
        },
      }),
    )

    for (let event of ctx.events.filter(
      (_e) => _e.type === MILESTONE && _e.context.accountId === e.context.accountId,
    ) as Extract<Event, { type: typeof MILESTONE }>[]) {
      event.payload.best = false
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice-paid', 'invoice-closed'] as const) {
    bus.on(status, (e: Extract<Event, { type: typeof status }>) => {
      let { paid } = stateByAccount.get(e.context.accountId)!

      for (let i = ctx.events.length - 1; i >= 0; i--) {
        let event = ctx.events[i]

        if (
          event.type === MILESTONE &&
          event.context.accountId === e.context.accountId &&
          event.payload.future &&
          event.payload.amount <= paid.max!
        ) {
          ctx.events.splice(i, 1)
        }
      }
    })
  }
}
