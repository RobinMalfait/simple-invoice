import { addDays, isPast, parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Discount } from '~/domain/discount/discount'
import { IncrementStrategy } from '~/domain/invoice/number-strategies'
import { Quote } from '~/domain/quote/quote'
import { total } from '~/ui/invoice/total'
import { match } from '~/utils/match'
import { Event } from '../events/event'
import { QuoteStatus } from '../quote/quote-status'
import { InvoiceItem } from './invoice-item'
import { InvoiceStatus } from './invoice-status'

type Configuration = {
  defaultNetStrategy: (issueDate: Date) => Date
  numberStrategy: (issueDate: Date) => string
}

const configuration: Configuration = {
  /**
   * The default net strategy, this will be used to calculate the dueDate based on the issueDate.
   *
   * Typically this is 30 days after the issueDate.
   */
  defaultNetStrategy: (issueDate: Date) => addDays(issueDate, 30),

  /**
   * All invoices should have an invoice number in ascending order. This is the strategy to
   * calculate the next invoice number.
   */
  numberStrategy: new IncrementStrategy().next,
}

// ---

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
  state: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.Draft),
  discounts: z.array(Discount),
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
  private _dueDate: Date | null = null
  private _discounts: Discount[] = []
  private _quote: Quote | null = null

  private state = InvoiceStatus.Draft
  private paid: number = 0
  private events: Event[] = [Event.parse({ type: 'invoice-drafted' })]

  public build(): Invoice {
    let input = {
      number: this._number ?? configuration.numberStrategy(this._issueDate!),
      account: this._account,
      client: this._client,
      items: this._items,
      note: this._note,
      issueDate: this._issueDate,
      dueDate: this._dueDate ?? configuration.defaultNetStrategy(this._issueDate!),
      discounts: this._discounts,
      state: this.state,
      events: this.events,
      quote: this._quote,
    }

    if (input.state !== InvoiceStatus.Paid && isPast(input.dueDate)) {
      input.state = InvoiceStatus.Overdue
      input.events.push(Event.parse({ type: 'invoice-overdue', at: input.dueDate }))
    }

    return Invoice.parse(input)
  }

  public static fromQuote(quote: Quote): InvoiceBuilder {
    if (quote.state !== QuoteStatus.Accepted) {
      throw new Error('Cannot convert a quote to an invoice that is not accepted')
    }

    let builder = new InvoiceBuilder()
    builder._account = quote.account
    builder._client = quote.client
    builder._items = quote.items
    builder._note = quote.note
    builder._discounts = quote.discounts
    builder.events = quote.events.slice()
    builder.events.push(Event.parse({ type: 'invoice-drafted', from: 'quote' }))
    builder._quote = quote
    return builder
  }

  public number(number: string): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }

    this._number = number
    return this
  }

  public account(account: Account): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }
    this._account = account
    return this
  }

  public client(client: Client): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }
    this._client = client
    return this
  }

  public items(items: InvoiceItem[]): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }
    this._items = items
    return this
  }

  public note(note: string | null): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }
    this._note = note
    return this
  }

  public issueDate(issueDate: string | Date): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }
    this._issueDate = typeof issueDate === 'string' ? parseISO(issueDate) : issueDate
    return this
  }

  public dueDate(dueDate: string | Date): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }
    this._dueDate = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
    return this
  }

  public discount(discount: Discount): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }

    if (new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1) {
      throw new Error('Discount with mixed tax rates is not supported')
    }

    this._discounts.push(discount)
    return this
  }

  public item(item: InvoiceItem): InvoiceBuilder {
    if (this.state !== InvoiceStatus.Draft) {
      throw new Error('Cannot edit an invoice that is not in draft state')
    }

    this._items.push(item)
    return this
  }

  public send(at: string | Date): InvoiceBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    match(this.state, {
      [InvoiceStatus.Draft]: () => {
        this.events.push(Event.parse({ type: 'invoice-sent', at: parsedAt }))
        this.state = InvoiceStatus.Sent
      },
      [InvoiceStatus.Sent]: () => {
        throw new Error('Cannot send an invoice that is already sent')
      },
      [InvoiceStatus.Paid]: () => {
        throw new Error('Cannot send an invoice that is already paid')
      },
      [InvoiceStatus.PartialPaid]: () => {
        throw new Error('Cannot send an invoice that is already partially paid')
      },
      [InvoiceStatus.Overdue]: () => {
        throw new Error('Cannot send an invoice that is overdue')
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
        this.state = InvoiceStatus.PartialPaid
      } else {
        this.events.push(
          Event.parse({ type: 'invoice-paid', at: parsedAt, amount, outstanding: remaining }),
        )
        this.state = InvoiceStatus.Paid
      }
    }

    match(this.state, {
      // When money comes in _before_ an invoice is sent
      [InvoiceStatus.Draft]: handlePayment,
      [InvoiceStatus.Sent]: handlePayment,
      [InvoiceStatus.Paid]: () => {
        throw new Error('Cannot pay an invoice that is already paid')
      },
      [InvoiceStatus.PartialPaid]: () => {
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
          this.state = InvoiceStatus.PartialPaid
        } else {
          this.events.push(
            Event.parse({ type: 'invoice-paid', at: parsedAt, amount, outstanding: remaining }),
          )
          this.state = InvoiceStatus.Paid
        }
      },
      [InvoiceStatus.Overdue]: () => {
        throw new Error('Cannot pay an invoice that is overdue')
      },
    })

    return this
  }
}
