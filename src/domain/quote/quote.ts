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
import { QuoteStatus } from '~/domain/quote/quote-status'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('quote')

let BaseQuote = z.object({
  type: z.literal('quote').default('quote'),
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
  items: z
    .array(
      z.lazy(() => {
        return InvoiceItem
      }),
    )
    .default([]),
  note: z.string().nullable(),
  quoteDate: z.date(),
  quoteExpirationDate: z.date(),
  discounts: z
    .array(
      z.lazy(() => {
        return Discount
      }),
    )
    .default([]),
  attachments: z
    .array(
      z.lazy(() => {
        return Document
      }),
    )
    .default([]),
  status: z.nativeEnum(QuoteStatus).default(QuoteStatus.Draft),
})

export type Quote = z.infer<typeof BaseQuote> & {
  quote: Quote | null
}

export let Quote = BaseQuote.extend({
  quote: z.lazy(() => {
    return Quote.nullable()
  }),
}) as z.ZodType<Quote>

export class QuoteBuilder {
  private _number: string | null = null
  private _account: Account | null = null
  private _client: Client | null = null
  private _items: InvoiceItem[] = []
  private _note: string | null = null
  private _quoteDate: Date | null = null
  private _quoteExpirationDate: Date | null = null
  private _discounts: Discount[] = []
  private _attachments: Document[] = []
  private _quote: Quote | null = null

  private _status = QuoteStatus.Draft

  private _events: Partial<Event>[] = []

  public constructor(private bus: EventEmitter = defaultBus) {}

  private emit(event: Event) {
    this.bus.emit(event.type, event)
  }

  public build(): Quote {
    let input = {
      number: this.computeNumber,
      account: this._account,
      client: this._client,
      items: this._items,
      note: this._note,
      quoteDate: this._quoteDate,
      quoteExpirationDate: this.computeQuoteExpirationDate,
      discounts: this._discounts,
      attachments: this._attachments,
      status: this.computeStatus,

      quote: this._quote,
    }

    let quote = Quote.parse(input)

    if (
      !this._events.some((e) => {
        return e.type === 'quote:drafted'
      })
    ) {
      this._events.unshift({ type: 'quote:drafted', payload: {} })
    }

    if (quote.status === QuoteStatus.Expired) {
      this._events.push({ type: 'quote:expired', at: quote.quoteExpirationDate })
    }

    for (let event of this._events.splice(0)) {
      this.emit(
        Event.parse({
          ...event,
          context: {
            ...event.context,
            accountId: quote.account.id,
            clientId: quote.client.id,
            quoteId: quote.id,
          },
        }),
      )
    }

    return quote
  }

  public static fromQuote(quote: Quote, { withAttachments = true } = {}): QuoteBuilder {
    if (
      ![QuoteStatus.Cancelled, QuoteStatus.Expired, QuoteStatus.Rejected].includes(quote.status)
    ) {
      throw new Error(`Cannot create a quote from another quote that is currently ${quote.status}`)
    }

    let builder = new QuoteBuilder()
    builder._account = quote.account
    builder._client = quote.client
    builder._quote = quote
    builder._items = quote.items.slice()
    builder._note = quote.note
    builder._discounts = quote.discounts.slice()
    if (withAttachments) {
      builder._attachments = quote.attachments.slice()
    }
    builder._events = [{ type: 'quote:drafted', payload: { from: 'quote' } }]

    return builder
  }

  private get computeNumber() {
    if (this._number) return this._number
    if (!this._quoteDate) return null // Let the validation handle this

    return config().quote.numberStrategy(this._quoteDate)
  }

  private get computeQuoteExpirationDate() {
    if (this._quoteExpirationDate) return this._quoteExpirationDate
    if (!this._quoteDate) return null // Let the validation handle this

    return config().quote.defaultNetStrategy(this._quoteDate)
  }

  private get computeStatus() {
    if (
      ![
        QuoteStatus.Accepted,
        QuoteStatus.Cancelled,
        QuoteStatus.Closed,
        QuoteStatus.Rejected,
      ].includes(this._status) &&
      isPast(this.computeQuoteExpirationDate!)
    ) {
      return QuoteStatus.Expired
    }

    return this._status
  }

  public number(number: string): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit a quote that is not in draft status')
    }

    this._number = number
    return this
  }

  public account(account: Account): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }
    this._account = account
    return this
  }

  public client(client: Client): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }
    this._client = client
    return this
  }

  public note(note: string | null): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }
    this._note = note
    return this
  }

  public quoteDate(quoteDate: string | Date): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }
    this._quoteDate = typeof quoteDate === 'string' ? parseISO(quoteDate) : quoteDate
    return this
  }

  public quoteExpirationDate(quoteExpirationDate: string | Date): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }
    this._quoteExpirationDate =
      typeof quoteExpirationDate === 'string' ? parseISO(quoteExpirationDate) : quoteExpirationDate
    return this
  }

  public discount(discount: Discount): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
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

  public attachments(attachments: Document[]): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }

    this._attachments = attachments.slice()
    return this
  }

  public attachment(attachment: Document): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }

    this._attachments.push(attachment)
    return this
  }

  public items(items: InvoiceItem[]): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
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

  public item(item: InvoiceItem): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
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

  public send(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (this._status === QuoteStatus.Draft) {
      this._status = QuoteStatus.Sent
      this._events.push({ type: 'quote:sent', at: parsedAt })
      return this
    }

    throw new Error(`Cannot send a quote that is in the ${this._status} state.`)
  }

  public accept(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (this._status === QuoteStatus.Sent) {
      this._status = QuoteStatus.Accepted
      this._events.push({ type: 'quote:accepted', at: parsedAt })
      return this
    }

    throw new Error(`Cannot accept a quote that is in the ${this._status} state.`)
  }

  public cancel(
    at: string | Date,
    payload: { by: 'account' | 'client'; reason: string },
  ): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (this._status === QuoteStatus.Accepted) {
      this._status = QuoteStatus.Cancelled
      this._events.push({
        type: 'quote:cancelled',
        payload: {
          cancelledBy: payload.by,
          reason: payload.reason,
        },
        at: parsedAt,
      })
      return this
    }

    throw new Error(`Cannot cancel a quote that is in the ${this._status} state.`)
  }

  public reject(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (this._status === QuoteStatus.Sent) {
      this._status = QuoteStatus.Rejected
      this._events.push({ type: 'quote:rejected', at: parsedAt })
      return this
    }

    throw new Error(`Cannot reject a quote that is in the ${this._status} state.`)
  }

  public close(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (isPast(this.computeQuoteExpirationDate!)) {
      this._events.push({ type: 'quote:expired', at: parsedAt })
      this._status = QuoteStatus.Expired
    }

    if (this._status === QuoteStatus.Expired) {
      this._status = QuoteStatus.Closed
      this._events.push({ type: 'quote:closed', at: parsedAt })
      return this
    }

    throw new Error(`Cannot close a quote that is in the ${this._status} state.`)
  }
}
