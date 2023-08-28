import { isPast, parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { config } from '~/domain/configuration/configuration'
import { Discount } from '~/domain/discount/discount'
import { Document } from '~/domain/document/document'
import { Event } from '~/domain/events/event'
import { InvoiceItem } from '~/domain/invoice/invoice-item'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { Quote } from '~/domain/quote/quote'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { total } from '~/ui/invoice/total'
import { match } from '~/utils/match'

export let Invoice = z.object({
  type: z.literal('invoice').default('invoice'),
  id: z.string().default(() => crypto.randomUUID()),
  number: z.string(),
  account: Account,
  client: Client,
  items: z.array(InvoiceItem),
  note: z.string().nullable(),
  issueDate: z.date(),
  dueDate: z.date(),
  discounts: z.array(Discount),
  attachments: z.array(Document).default([]),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.Draft),
  events: z.array(Event),

  quote: Quote.nullable(),
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

  private _status = InvoiceStatus.Draft
  private paid: number = 0
  private events: Event[] = [Event.parse({ type: 'invoice-drafted' })]

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
      events: this.events,
      quote: this._quote,
    }

    if (input.status === InvoiceStatus.Overdue) {
      input.events.push(Event.parse({ type: 'invoice-overdue', at: input.dueDate }))
    }

    return Invoice.parse(input)
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
    builder.events = [Event.parse({ type: 'invoice-drafted', from: 'quote' })]
    builder._quote = quote
    return builder
  }

  private get computeNumber() {
    if (this._number) return this._number
    if (!this._issueDate) return null // Let the validation handle this

    return config().invoice.numberStrategy(this._issueDate)
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

    if (new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1) {
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
      new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1
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
      new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1
    ) {
      throw new Error(
        'You already had discounts configured, but this is not supported for mixed tax rates right now',
      )
    }

    return this
  }

  public send(at: string | Date): InvoiceBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    match(this._status, {
      [InvoiceStatus.Draft]: () => {
        this.events.push(Event.parse({ type: 'invoice-sent', at: parsedAt }))
        this._status = InvoiceStatus.Sent
      },
      [InvoiceStatus.Sent]: () => {
        throw new Error('Cannot send an invoice that is already sent')
      },
      [InvoiceStatus.Paid]: () => {
        throw new Error('Cannot send an invoice that is already paid')
      },
      [InvoiceStatus.PartiallyPaid]: () => {
        throw new Error('Cannot send an invoice that is already partially paid')
      },
      [InvoiceStatus.Overdue]: () => {
        throw new Error('Cannot send an invoice that is overdue')
      },
      [InvoiceStatus.Closed]: () => {
        throw new Error('Cannot send an invoice that is closed')
      },
    })

    return this
  }

  public pay(
    at: string | Date,
    amount = total({ items: this._items, discounts: this._discounts }),
  ): InvoiceBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    let handlePayment = () => {
      let remaining = total({ items: this._items, discounts: this._discounts }) - this.paid - amount

      this.paid += amount

      if (remaining > 0) {
        this.events.push(
          Event.parse({
            type: 'invoice-partially-paid',
            at: parsedAt,
            amount,
            outstanding: remaining,
          }),
        )
        this._status = InvoiceStatus.PartiallyPaid
      } else {
        this.events.push(
          Event.parse({ type: 'invoice-paid', at: parsedAt, amount, outstanding: remaining }),
        )
        this._status = InvoiceStatus.Paid
      }
    }

    match(this._status, {
      // When money comes in _before_ an invoice is sent
      [InvoiceStatus.Draft]: handlePayment,
      [InvoiceStatus.Sent]: handlePayment,
      [InvoiceStatus.Paid]: () => {
        throw new Error('Cannot pay an invoice that is already paid')
      },
      [InvoiceStatus.PartiallyPaid]: () => {
        let remaining =
          total({ items: this._items, discounts: this._discounts }) - this.paid - amount

        this.paid += amount

        if (remaining > 0) {
          this.events.push(
            Event.parse({
              type: 'invoice-partially-paid',
              at: parsedAt,
              amount,
              outstanding: remaining,
            }),
          )
          this._status = InvoiceStatus.PartiallyPaid
        } else {
          this.events.push(
            Event.parse({ type: 'invoice-paid', at: parsedAt, amount, outstanding: remaining }),
          )
          this._status = InvoiceStatus.Paid
        }
      },
      [InvoiceStatus.Overdue]: () => {
        throw new Error('Cannot pay an invoice that is overdue')
      },
      [InvoiceStatus.Closed]: () => {
        throw new Error('Cannot pay an invoice that is closed')
      },
    })

    return this
  }

  public close(at: string | Date): InvoiceBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (isPast(this.computeDueDate!)) {
      this.events.push(Event.parse({ type: 'invoice-overdue', at: parsedAt }))
      this._status = InvoiceStatus.Overdue
    }

    match(this._status, {
      [InvoiceStatus.Draft]: () => {
        throw new Error('Cannot close an invoice that is in draft')
      },
      [InvoiceStatus.Sent]: () => {
        throw new Error('Cannot close an invoice that is sent')
      },
      [InvoiceStatus.Paid]: () => {
        throw new Error('Cannot close an invoice that is already paid')
      },
      [InvoiceStatus.PartiallyPaid]: () => {
        throw new Error('Cannot close an invoice that is already partially paid')
      },
      [InvoiceStatus.Overdue]: () => {
        this.events.push(Event.parse({ type: 'invoice-closed', at: parsedAt }))
        this._status = InvoiceStatus.Closed
      },
      [InvoiceStatus.Closed]: () => {
        throw new Error('Cannot close an invoice that is closed')
      },
    })

    return this
  }
}
