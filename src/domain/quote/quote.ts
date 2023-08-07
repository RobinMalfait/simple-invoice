import { addDays, isPast, parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Discount } from '~/domain/discount/discount'
import { Event } from '~/domain/events/event'
import { InvoiceItem } from '~/domain/invoice/invoice-item'
import { IncrementStrategy } from '~/domain/invoice/number-strategies'
import { match } from '~/utils/match'
import { QuoteStatus } from './quote-status'

type Configuration = {
  defaultNetStrategy: (quoteDate: Date) => Date
  numberStrategy: (quoteDate: Date) => string
}

const configuration: Configuration = {
  /**
   * The default net strategy, this will be used to calculate the quoteExpirationDate based on the
   * quoteDate.
   *
   * Typically this is 15 days after the quoteDate.
   */
  defaultNetStrategy: (quoteDate: Date) => addDays(quoteDate, 15),

  /**
   * All quotes should have an quote number in ascending order. This is the strategy to
   * calculate the next quote number.
   */
  numberStrategy: new IncrementStrategy().next,
}

// ---

export let Quote = z.object({
  type: z.literal('quote').default('quote'),
  id: z.string().default(() => crypto.randomUUID()),
  number: z.string(),
  account: Account,
  client: Client,
  items: z.array(InvoiceItem),
  note: z.string().nullable(),
  quoteDate: z.date(),
  quoteExpirationDate: z.date(),
  status: z.nativeEnum(QuoteStatus).default(QuoteStatus.Draft),
  discounts: z.array(Discount),
  events: z.array(Event),
})

export type Quote = z.infer<typeof Quote>

export class QuoteBuilder {
  private _number: string | null = null
  private _account: Account | null = null
  private _client: Client | null = null
  private _items: InvoiceItem[] = []
  private _note: string | null = null
  private _quoteDate: Date | null = null
  private _quoteExpirationDate: Date | null = null
  private _discounts: Discount[] = []
  private events: Quote['events'] = [Event.parse({ type: 'quote-drafted' })]

  private _status = QuoteStatus.Draft

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
      status: this._status,
      events: this.events,
    }

    if (input.status === QuoteStatus.Expired) {
      input.events.push(Event.parse({ type: 'quote-expired', at: input.quoteExpirationDate }))
    }

    return Quote.parse(input)
  }

  get computeNumber() {
    if (this._number) return this._number
    if (!this._quoteDate) return null // Let the validation handle this

    return configuration.numberStrategy(this._quoteDate)
  }

  get computeQuoteExpirationDate() {
    if (this._quoteExpirationDate) return this._quoteExpirationDate
    if (!this._quoteDate) return null // Let the validation handle this

    return configuration.defaultNetStrategy(this._quoteDate)
  }

  get computeStatus() {
    if (
      ![QuoteStatus.Accepted, QuoteStatus.Closed].includes(this._status) &&
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

  public items(items: InvoiceItem[]): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }
    this._items = items
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

    if (new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1) {
      throw new Error('Discount with mixed tax rates is not supported')
    }

    this._discounts.push(discount)
    return this
  }

  public item(item: InvoiceItem): QuoteBuilder {
    if (this._status !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft status')
    }

    this._items.push(item)
    return this
  }

  public send(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    match(this._status, {
      [QuoteStatus.Draft]: () => {
        this.events.push(Event.parse({ type: 'quote-sent', at: parsedAt }))
        this._status = QuoteStatus.Sent
      },
      [QuoteStatus.Sent]: () => {
        throw new Error('Cannot send a quote that is already sent')
      },
      [QuoteStatus.Accepted]: () => {
        throw new Error('Cannot send a quote that is already accepted')
      },
      [QuoteStatus.Rejected]: () => {
        throw new Error('Cannot send a quote that is already rejected')
      },
      [QuoteStatus.Expired]: () => {
        throw new Error('Cannot send a quote that is already expired')
      },
      [QuoteStatus.Closed]: () => {
        throw new Error('Cannot send a quote that is already closed')
      },
    })

    return this
  }

  public accept(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    match(this._status, {
      [QuoteStatus.Draft]: () => {
        throw new Error('Cannot accept a quote that is not sent')
      },
      [QuoteStatus.Sent]: () => {
        this.events.push(Event.parse({ type: 'quote-accepted', at: parsedAt }))
        this._status = QuoteStatus.Accepted
      },
      [QuoteStatus.Accepted]: () => {
        throw new Error('Cannot accept a quote that is already accepted')
      },
      [QuoteStatus.Rejected]: () => {
        throw new Error('Cannot accept a quote that is already rejected')
      },
      [QuoteStatus.Expired]: () => {
        throw new Error('Cannot accept a quote that is already expired')
      },
      [QuoteStatus.Closed]: () => {
        throw new Error('Cannot accept a quote that is already closed')
      },
    })

    return this
  }

  public reject(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    match(this._status, {
      [QuoteStatus.Draft]: () => {
        throw new Error('Cannot reject a quote that is not sent')
      },
      [QuoteStatus.Sent]: () => {
        this.events.push(Event.parse({ type: 'quote-rejected', at: parsedAt }))
        this._status = QuoteStatus.Rejected
      },
      [QuoteStatus.Accepted]: () => {
        throw new Error('Cannot reject a quote that is already accepted')
      },
      [QuoteStatus.Rejected]: () => {
        throw new Error('Cannot reject a quote that is already rejected')
      },
      [QuoteStatus.Expired]: () => {
        throw new Error('Cannot reject a quote that is already expired')
      },
      [QuoteStatus.Closed]: () => {
        throw new Error('Cannot reject a quote that is already expired')
      },
    })

    return this
  }

  public close(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    if (isPast(this.computeQuoteExpirationDate!)) {
      this.events.push(Event.parse({ type: 'quote-expired', at: parsedAt }))
      this._status = QuoteStatus.Expired
    }

    match(this._status, {
      [QuoteStatus.Draft]: () => {
        throw new Error('Cannot close a quote that is not sent')
      },
      [QuoteStatus.Sent]: () => {
        throw new Error('Cannot close a quote that is sent')
      },
      [QuoteStatus.Accepted]: () => {
        throw new Error('Cannot close a quote that is accepted')
      },
      [QuoteStatus.Rejected]: () => {
        throw new Error('Cannot close a quote that is rejected')
      },
      [QuoteStatus.Expired]: () => {
        this.events.push(Event.parse({ type: 'quote-closed', at: parsedAt }))
        this._status = QuoteStatus.Closed
      },
      [QuoteStatus.Closed]: () => {
        throw new Error('Cannot close a quote that is closed')
      },
    })

    return this
  }
}
