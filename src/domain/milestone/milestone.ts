import { differenceInSeconds, differenceInYears, parseISO } from 'date-fns'
import * as lazy from 'lazy-collections'
import EventEmitter from 'node:events'
import { z } from 'zod'
import { Account } from '~/domain/account/account'
import { bus as defaultBus } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { total } from '~/ui/invoice/total'
import { DefaultMap } from '~/utils/default-map'
import { ScopedIDGenerator } from '~/utils/id'

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
  internationalClientCountMilestones(bus, ctx)
  mostExpensiveInvoiceMilestones(bus, ctx)
  anniversaryMilestones(bus, ctx)
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

  bus.on('quote:sent', (e: Extract<Event, { type: 'quote:sent' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    state.sentAt.set(e.context.quoteId, e.at!)
  })

  bus.on('quote:accepted', (e: Extract<Event, { type: 'quote:accepted' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    let duration = differenceInSeconds(e.at!, state.sentAt.get(e.context.quoteId)!)

    if (state.max !== null && duration >= state.max) {
      state.sentAt.delete(e.context.quoteId)
      return
    }

    if (state.max === null) {
      state.max = duration
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
          quoteId: e.context.quoteId,
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

  bus.on('invoice:sent', (e: Extract<Event, { type: 'invoice:sent' }>) => {
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

  bus.on('invoice:paid', (e: Extract<Event, { type: 'invoice:paid' }>) => {
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
          },
          at: e.at,
        }),
      )
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed'] as const) {
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

  bus.on('invoice:sent', (e: Extract<Event, { type: 'invoice:sent' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    state.sentAt.set(e.context.invoiceId, e.at!)
  })

  bus.on('invoice:paid', (e: Extract<Event, { type: 'invoice:paid' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    if (!state.sentAt.has(e.context.invoiceId)) {
      return
    }

    let duration = differenceInSeconds(e.at!, state.sentAt.get(e.context.invoiceId)!)

    if (state.max !== null && duration >= state.max) {
      state.sentAt.delete(e.context.invoiceId)
      return
    }

    if (state.max === null) {
      state.max = duration
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
          invoiceId: e.context.invoiceId,
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

export function clientCountMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:clients'

  let stateByAccount = initState(() => ({
    milestones: [100, 75, 50, 25, 10, 5, 3],
    clientByInvoice: new Map<string, string>(),
  }))

  bus.on('invoice:sent', (e: Extract<Event, { type: 'invoice:sent' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.clientByInvoice.set(e.context.invoiceId, e.context.clientId)

    let amount = lazy.pipe(
      lazy.concat(pending.clientByInvoice.values(), paid.clientByInvoice.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    for (let milestone of milestones(pending.milestones, (m) => m <= amount)) {
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

  bus.on('invoice:paid', (e: Extract<Event, { type: 'invoice:paid' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.clientByInvoice.delete(e.context.invoiceId)
    paid.clientByInvoice.set(e.context.invoiceId, e.context.clientId)

    let amount = lazy.pipe(
      lazy.concat(paid.clientByInvoice.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    for (let milestone of milestones(paid.milestones, (m) => m <= amount)) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
          },
          payload: {
            amount: milestone,
          },
          at: e.at,
        }),
      )
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed'] as const) {
    bus.on(status, (e: Extract<Event, { type: typeof status }>) => {
      let { pending, paid } = stateByAccount.get(e.context.accountId)!

      pending.clientByInvoice.delete(e.context.invoiceId)

      let amount = lazy.pipe(
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
          event.payload.amount <= amount
        ) {
          ctx.events.splice(i, 1)
        }
      }
    })
  }
}

export function internationalClientCountMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:international-clients'

  let stateByAccount = initState(() => ({
    milestones: [100, 75, 50, 25, 10, 5, 3, 1],
    countryByInvoice: new Map<string, string | null>(),
  }))

  bus.on('invoice:sent', (e: Extract<Event, { type: 'invoice:sent' }>) => {
    if (e.payload.invoice.client.billing.country === e.payload.invoice.account.billing.country) {
      return
    }

    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.countryByInvoice.set(e.context.invoiceId, e.context.clientId)

    let amount = lazy.pipe(
      lazy.concat(pending.countryByInvoice.values(), paid.countryByInvoice.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    for (let milestone of milestones(pending.milestones, (m) => m <= amount)) {
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

  bus.on('invoice:paid', (e: Extract<Event, { type: 'invoice:paid' }>) => {
    if (e.payload.invoice.client.billing.country === e.payload.invoice.account.billing.country) {
      return
    }

    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.countryByInvoice.delete(e.context.invoiceId)
    paid.countryByInvoice.set(e.context.invoiceId, e.context.clientId)

    let amount = lazy.pipe(
      lazy.concat(paid.countryByInvoice.values()),
      lazy.unique(),
      lazy.toLength(),
    )()

    for (let milestone of milestones(paid.milestones, (m) => m <= amount)) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
          },
          payload: {
            amount: milestone,
          },
          at: e.at,
        }),
      )
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed'] as const) {
    bus.on(status, (e: Extract<Event, { type: typeof status }>) => {
      if (e.payload.invoice.client.billing.country === e.payload.invoice.account.billing.country) {
        return
      }

      let { pending, paid } = stateByAccount.get(e.context.accountId)!

      pending.countryByInvoice.delete(e.context.invoiceId)

      let amount = lazy.pipe(
        lazy.concat(paid.countryByInvoice.values()),
        lazy.unique(),
        lazy.toLength(),
      )()

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

export function revenueMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:revenue'

  let stateByAccount = initState(() => ({
    milestones: [
      10_000_000_00, 5_000_000_00, 1_500_000_00, 1_000_000_00, 750_000_00, 500_000_00, 250_000_00,
      100_000_00, 50_000_00, 10_000_00, 5_000_00, 1_000_00, 500_00, 100_00,
    ],
    totalByInvoice: new Map<string, number>(),
  }))

  bus.on('invoice:sent', (e: Extract<Event, { type: 'invoice:sent' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.totalByInvoice.set(e.context.invoiceId, total(e.payload.invoice))

    let amount = sum(pending.totalByInvoice.values(), paid.totalByInvoice.values())

    for (let milestone of milestones(pending.milestones, (m) => m <= amount)) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
            clientId: e.context.clientId,
          },
          payload: {
            amount,
            milestone,
            future: true,
          },
        }),
      )
    }
  })

  bus.on('invoice:paid', (e: Extract<Event, { type: 'invoice:paid' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    pending.totalByInvoice.delete(e.context.invoiceId)
    paid.totalByInvoice.set(e.context.invoiceId, total(e.payload.invoice))

    let amount = sum(paid.totalByInvoice.values())

    for (let milestone of milestones(paid.milestones, (m) => m <= amount)) {
      bus.emit(
        MILESTONE,
        Event.parse({
          type: MILESTONE,
          context: {
            accountId: e.context.accountId,
            invoiceId: e.context.invoiceId,
          },
          payload: {
            amount,
            milestone,
          },
          at: e.at,
        }),
      )
    }
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed'] as const) {
    bus.on(status, (e: Extract<Event, { type: typeof status }>) => {
      let { pending, paid } = stateByAccount.get(e.context.accountId)!
      pending.totalByInvoice.delete(e.context.invoiceId)

      let amount = sum(pending.totalByInvoice.values(), paid.totalByInvoice.values())

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

export function mostExpensiveInvoiceMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:most-expensive-invoice'

  let stateByAccount = initState(() => ({
    max: null as number | null,
  }))

  bus.on('invoice:sent', (e: Extract<Event, { type: 'invoice:sent' }>) => {
    let { pending, paid } = stateByAccount.get(e.context.accountId)!

    let amount = total(e.payload.invoice)

    if (pending.max === null) {
      pending.max = amount
      return
    }

    if (amount <= Math.max(pending.max, paid.max ?? 0)) {
      return
    }

    let previous = pending.max
    pending.max = amount

    bus.emit(
      MILESTONE,
      Event.parse({
        type: MILESTONE,
        context: {
          accountId: e.context.accountId,
          invoiceId: e.context.invoiceId,
          clientId: e.context.clientId,
        },
        payload: {
          amount: amount,
          increase: Number(((amount / previous - 1) * 100).toFixed(0)),
          future: true,
          best: true,
        },
      }),
    )
  })

  bus.on('invoice:paid', (e: Extract<Event, { type: 'invoice:paid' }>) => {
    let { paid } = stateByAccount.get(e.context.accountId)!

    let amount = total(e.payload.invoice)

    if (paid.max === null) {
      paid.max = amount
      return
    }

    if (amount <= paid.max) {
      return
    }

    let previous = paid.max
    paid.max = amount

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
          invoiceId: e.context.invoiceId,
        },
        payload: {
          amount: amount,
          increase: Number(((amount / previous - 1) * 100).toFixed(0)),
          best: true,
        },
        at: e.at,
      }),
    )
  })

  // Cleanup future milestones if they are not relevant anymore
  for (let status of ['invoice:paid', 'invoice:closed'] as const) {
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

export function anniversaryMilestones(bus: EventEmitter, ctx: Context) {
  const MILESTONE = 'milestone:anniversary'

  let stateByAccount = new DefaultMap(() => ({
    start: null as Date | null,
  }))

  bus.on('invoice:sent', (e: Extract<Event, { type: 'invoice:sent' }>) => {
    let state = stateByAccount.get(e.context.accountId)!

    if (state.start === null) {
      state.start = e.at
      return
    }

    let years = differenceInYears(e.at!, state.start)
    if (years <= 0) {
      return
    }

    let count = ctx.events.filter(
      (e) => e.type === MILESTONE && e.context.accountId === e.context.accountId,
    ).length

    if (years <= count) {
      return
    }

    bus.emit(
      MILESTONE,
      Event.parse({
        type: MILESTONE,
        context: {
          accountId: e.context.accountId,
        },
        payload: {
          start: state.start,
        },
        at: e.at,
      }),
    )
  })
}

// ---

let scopedId = new ScopedIDGenerator('milestone')

export let Milestone = z.object({
  id: z.string().default(() => scopedId.next()),
  account: z.lazy(() => Account),
  title: z.string(),
  description: z.string().nullable(),
  achievedAt: z.date().nullable(),
})

export type Milestone = z.infer<typeof Milestone>

export class MilestoneBuilder {
  private _account: Account | null = null
  private _title: string | null = null
  private _description: string | null = null
  private _achievedAt: Date | null = null

  public constructor(private bus: EventEmitter = defaultBus) {}

  private emit(event: Event) {
    this.bus.emit(event.type, event)
  }

  public build(): Milestone {
    let input = {
      account: this._account,
      title: this._title,
      description: this._description,
      achievedAt: this._achievedAt,
    }

    let milestone = Milestone.parse(input)

    this.emit(
      Event.parse({
        type: 'milestone:custom',
        context: {
          accountId: milestone.account.id,
        },
        payload: {
          title: this._title,
          description: this._description,
        },
        at: this._achievedAt,
      }),
    )

    return milestone
  }

  public account(account: Account): MilestoneBuilder {
    this._account = account
    return this
  }

  public title(title: string): MilestoneBuilder {
    this._title = title
    return this
  }

  public description(description: string): MilestoneBuilder {
    this._description = description
    return this
  }

  public achievedAt(achievedAt: string | Date): MilestoneBuilder {
    let parsedAchievedAt = typeof achievedAt === 'string' ? parseISO(achievedAt) : achievedAt
    this._achievedAt = parsedAchievedAt
    return this
  }
}
