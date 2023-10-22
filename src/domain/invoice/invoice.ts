import EventEmitter from 'node:events'

import { isPast, parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { config } from '~/domain/configuration/configuration'
import { Discount } from '~/domain/discount/discount'
import { Document } from '~/domain/document/document'
import { bus as defaultBus } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { InvoiceItem } from '~/domain/invoice/invoice-item'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { Quote } from '~/domain/quote/quote'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { DeepPartial } from '~/types/shared'
import { total } from '~/ui/invoice/total'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('invoice')

export let Invoice = z.object({
  type: z.literal('invoice').default('invoice'),
  id: z.string().default(() => {
    return scopedId.next()
  }),
  number: z.string(),
  account: z.lazy(() => {
    return Account
  }),
  client: z.lazy(() => {
    return Client
  }),
  items: z.array(
    z.lazy(() => {
      return InvoiceItem
    }),
  ),
  note: z.string().nullable(),
  issueDate: z.date(),
  dueDate: z.date(),
  discounts: z.array(
    z.lazy(() => {
      return Discount
    }),
  ),
  attachments: z
    .array(
      z.lazy(() => {
        return Document
      }),
    )
    .default([]),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.Draft),
  paid: z.number(),
  outstanding: z.number(),
  paidAt: z.date().nullable(),
  quote: z.lazy(() => {
    return Quote.nullable()
  }),

  // Visual representation
  qr: z.boolean().nullable().default(null),
})

export type Invoice = z.infer<typeof Invoice>

export class InvoiceBuilder {
  private _number: string | null = null
  private _account: Account | null = null
  private _client: Client | null = null
  private _items: InvoiceItem[] = []
  private _note: string | null = null
  private _issueDate: Date | null = null
  private _dueDate: Date | ((issueDate: Date) => Date) | null = null
  private _discounts: Discount[] = []
  private _attachments: Document[] = []
  private _quote: Quote | null = null
  private _paidAt: Date | null = null
  private _qr: Invoice['qr'] | null = null

  private _status = InvoiceStatus.Draft
  private paid: number = 0
  private outstanding: number | null = null

  private _events: DeepPartial<Extract<Event, { type: `invoice:${string}` }>>[] = []

  public constructor(private bus: EventEmitter = defaultBus) {}

  private emit(event: Event) {
    this.bus.emit(event.type, event)
  }

  public build(): Invoice {
    let input = {
      number: this.computeNumber,
      account: this._account,
      client: this._client,
      items: this._items,
      note: this._note,
      issueDate: this._issueDate,
      dueDate: this.computeDueDate,
      discounts: this._discounts,
      attachments: this._attachments,
      status: this.computeStatus,
      quote: this._quote,
      paidAt: this._paidAt,
      paid: this.paid,
      outstanding: this.outstanding ?? total({ items: this._items, discounts: this._discounts }),
      qr: this._qr,
    }

    let invoice = Invoice.parse(input)

    if (
      !this._events.some((e) => {
        return e.type === 'invoice:drafted'
      })
    ) {
      this._events.unshift({ type: 'invoice:drafted' })
    }

    if (invoice.status === InvoiceStatus.Overdue) {
      this._events.push({ type: 'invoice:overdue', at: invoice.dueDate })
    }

    for (let event of this._events) {
      this.emit(
        Event.parse({
          ...event,
          context: {
            ...event.context,
            accountId: invoice.account.id,
            clientId: invoice.client.id,
            invoiceId: invoice.id,
          },
          payload: {
            ...event.payload,
            invoice,
          },
        }),
      )
    }

    return invoice
  }

  public static fromQuote(quote: Quote, { withAttachments = true } = {}): InvoiceBuilder {
    if (quote.status !== QuoteStatus.Accepted) {
      throw new Error('Cannot convert a quote to an invoice that is not accepted')
    }

    let builder = new InvoiceBuilder()
    builder._account = quote.account
    builder._client = quote.client
    builder._items = quote.items.slice()
    builder._note = quote.note
    builder._discounts = quote.discounts.slice()
    if (withAttachments) {
      builder._attachments = quote.attachments.slice()
    }
    builder._quote = quote

    builder._events.push({
      type: 'invoice:drafted',
      payload: {
        from: 'quote',
      },
    })

    return builder
  }

  private get computeNumber() {
    if (this._number) return this._number
    if (!this._issueDate) return null // Let the validation handle this

    this._number = config().invoice.numberStrategy(this._issueDate)
    return this._number
  }

  private get computeDueDate() {
    if (this._dueDate instanceof Date) return this._dueDate
    if (!this._issueDate) return null // Let the validation handle this
    if (typeof this._dueDate === 'function') {
      this._dueDate = this._dueDate(this._issueDate)
      return this._dueDate
    }

    return config().invoice.defaultNetStrategy(this._issueDate)
  }

  private get computeStatus() {
    if (
      ![InvoiceStatus.Paid, InvoiceStatus.Closed].includes(this._status) &&
      isPast(this.computeDueDate!)
    ) {
      return InvoiceStatus.Overdue
    }

    return this._status
  }

  public number(number: string): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }

    this._number = number
    return this
  }

  public account(account: Account): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }
    this._account = account
    return this
  }

  public client(client: Client): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }
    this._client = client
    return this
  }

  public note(note: string | null): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }
    this._note = note
    return this
  }

  public issueDate(issueDate: string | Date): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }
    this._issueDate = typeof issueDate === 'string' ? parseISO(issueDate) : issueDate
    return this
  }

  public dueDate(dueDate: string | Date | ((issueDate: Date) => Date)): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }
    this._dueDate = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
    return this
  }

  public discount(discount: Discount): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }

    if (
      new Set(
        this._items
          .map((item) => {
            return item.taxRate
          })
          .filter((rate) => {
            return rate !== 0
          }),
      ).size > 1
    ) {
      throw new Error('Discount with mixed tax rates is not supported')
    }

    this._discounts.push(discount)
    return this
  }

  public attachments(attachments: Document[]): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }

    this._attachments = attachments.slice()
    return this
  }

  public attachment(attachment: Document): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }

    this._attachments.push(attachment)
    return this
  }

  public items(items: InvoiceItem[]): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }

    this._items = items.slice()

    if (
      this._discounts.length > 0 &&
      new Set(
        this._items
          .map((item) => {
            return item.taxRate
          })
          .filter((rate) => {
            return rate !== 0
          }),
      ).size > 1
    ) {
      throw new Error(
        'You already had discounts configured, but this is not supported for mixed tax rates right now',
      )
    }
    return this
  }

  public item(item: InvoiceItem): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }

    this._items.push(item)

    if (
      this._discounts.length > 0 &&
      new Set(
        this._items
          .map((item) => {
            return item.taxRate
          })
          .filter((rate) => {
            return rate !== 0
          }),
      ).size > 1
    ) {
      throw new Error(
        'You already had discounts configured, but this is not supported for mixed tax rates right now',
      )
    }

    return this
  }

  public qr(qr: Invoice['qr']): InvoiceBuilder {
    if (this._status !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft status')
    }

    this._qr = qr

    return this
  }

  public send(at: string | Date): InvoiceBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (this._status === InvoiceStatus.Draft) {
      this._status = InvoiceStatus.Sent
      this._events.push({ type: 'invoice:sent', at: parsedAt })
      return this
    }

    throw new Error(`Cannot send an invoice that is in the ${this._status} state.`)
  }

  public pay(
    at: string | Date,
    amount = total({ items: this._items, discounts: this._discounts }),
  ): InvoiceBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (this.outstanding === null) {
      this.outstanding = total({ items: this._items, discounts: this._discounts })
    }

    if (
      [
        InvoiceStatus.Draft, // When money comes in _before_ an invoice is sent
        InvoiceStatus.Sent,
        InvoiceStatus.PartiallyPaid,
      ].includes(this._status)
    ) {
      this.paid += amount
      this.outstanding! -= amount

      if (this.outstanding! > 0) {
        this._status = InvoiceStatus.PartiallyPaid

        this._events.push({
          type: 'invoice:partially-paid',
          payload: {
            amount,
            outstanding: this.outstanding!,
          },
          at: parsedAt,
        })
      } else {
        this._paidAt = parsedAt
        this._status = InvoiceStatus.Paid
        this._events.push({
          type: 'invoice:paid',
          payload: {
            amount,
            outstanding: this.outstanding!,
          },
          at: parsedAt,
        })
      }
      return this
    }

    throw new Error(`Cannot pay an invoice that is in the ${this._status} state.`)
  }

  public close(at: string | Date): InvoiceBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (isPast(this.computeDueDate!)) {
      this._status = InvoiceStatus.Overdue
      this._events.push({
        type: 'invoice:overdue',
        at: parsedAt,
      })
    }

    if (this._status === InvoiceStatus.Overdue) {
      this._status = InvoiceStatus.Closed
      this._events.push({
        type: 'invoice:closed',
        at: parsedAt,
      })

      return this
    }

    throw new Error(`Cannot close an invoice that is in the ${this._status} state.`)
  }
}
