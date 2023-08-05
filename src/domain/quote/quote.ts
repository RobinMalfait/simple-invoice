import { addDays, isPast, parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Discount } from '~/domain/discount/discount'
import { InvoiceItem } from '~/domain/invoice/invoice-item'
import { IncrementStrategy } from '~/domain/invoice/number-strategies'
import { match } from '~/utils/match'
import { Event } from '../events/event'
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
  state: z.nativeEnum(QuoteStatus).default(QuoteStatus.Draft),
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

  private state = QuoteStatus.Draft

  public build(): Quote {
    let input = {
      number: this._number ?? configuration.numberStrategy(this._quoteDate!),
      account: this._account,
      client: this._client,
      items: this._items,
      note: this._note,
      quoteDate: this._quoteDate,
      quoteExpirationDate:
        this._quoteExpirationDate ?? configuration.defaultNetStrategy(this._quoteDate!),
      discounts: this._discounts,
      state: this.state,
      events: this.events,
    }

    if (input.state !== QuoteStatus.Accepted && isPast(input.quoteExpirationDate)) {
      input.state = QuoteStatus.Expired
      input.events.push(Event.parse({ type: 'quote-expired', at: input.quoteExpirationDate }))
    }

    return Quote.parse(input)
  }

  public number(number: string): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit a quote that is not in draft state')
    }

    this._number = number
    return this
  }

  public account(account: Account): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft state')
    }
    this._account = account
    return this
  }

  public client(client: Client): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft state')
    }
    this._client = client
    return this
  }

  public items(items: InvoiceItem[]): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft state')
    }
    this._items = items
    return this
  }

  public note(note: string | null): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft state')
    }
    this._note = note
    return this
  }

  public quoteDate(quoteDate: string | Date): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft state')
    }
    this._quoteDate = typeof quoteDate === 'string' ? parseISO(quoteDate) : quoteDate
    return this
  }

  public quoteExpirationDate(quoteExpirationDate: string | Date): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft state')
    }
    this._quoteExpirationDate =
      typeof quoteExpirationDate === 'string' ? parseISO(quoteExpirationDate) : quoteExpirationDate
    return this
  }

  public discount(discount: Discount): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft state')
    }

    if (new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1) {
      throw new Error('Discount with mixed tax rates is not supported')
    }

    this._discounts.push(discount)
    return this
  }

  public item(item: InvoiceItem): QuoteBuilder {
    if (this.state !== QuoteStatus.Draft) {
      throw new Error('Cannot edit an quote that is not in draft state')
    }

    this._items.push(item)
    return this
  }

  public send(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    match(this.state, {
      [QuoteStatus.Draft]: () => {
        this.events.push(Event.parse({ type: 'quote-sent', at: parsedAt }))
        this.state = QuoteStatus.Sent
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
    })

    return this
  }

  public accept(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    match(this.state, {
      [QuoteStatus.Draft]: () => {
        throw new Error('Cannot accept a quote that is not sent')
      },
      [QuoteStatus.Sent]: () => {
        this.events.push(Event.parse({ type: 'quote-accepted', at: parsedAt }))
        this.state = QuoteStatus.Accepted
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
    })

    return this
  }

  public reject(at: string | Date): QuoteBuilder {
    let parsedAt = typeof at === 'string' ? parseISO(at) : at

    match(this.state, {
      [QuoteStatus.Draft]: () => {
        throw new Error('Cannot reject a quote that is not sent')
      },
      [QuoteStatus.Sent]: () => {
        this.events.push(Event.parse({ type: 'quote-rejected', at: parsedAt }))
        this.state = QuoteStatus.Rejected
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
    })

    return this
  }
}
