import { isPast, parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { config } from '~/domain/configuration/configuration'
import { Discount } from '~/domain/discount/discount'
import { Document } from '~/domain/document/document'
import { Event } from '~/domain/events/event'
import { InvoiceItem } from '~/domain/invoice/invoice-item'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { ScopedIDGenerator } from '~/utils/id'
import { match } from '~/utils/match'

let scopedId = new ScopedIDGenerator('quote')

let BaseQuote = z.object({
  type: z.literal('quote').default('quote'),
  id: z.string().default(() => scopedId.next()),
  number: z.string(),
  account: Account,
  client: Client,
  items: z.array(InvoiceItem).default([]),
  note: z.string().nullable(),
  quoteDate: z.date(),
  quoteExpirationDate: z.date(),
  discounts: z.array(Discount).default([]),
  attachments: z.array(Document).default([]),
  status: z.nativeEnum(QuoteStatus).default(QuoteStatus.Draft),
  events: z.array(Event),
})

export type Quote = z.infer<typeof BaseQuote> & {
  quote: Quote | null
}

export let Quote = BaseQuote.extend({
  quote: z.lazy(() => Quote.nullable()),
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
  private events: Quote['events'] = [Event.parse({ type: 'quote-drafted' })]
  private _quote: Quote | null = null

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
      attachments: this._attachments,
      status: this.computeStatus,
      events: this.events,

      quote: this._quote,
    }

    if (input.status === QuoteStatus.Expired) {
      input.events.push(Event.parse({ type: 'quote-expired', at: input.quoteExpirationDate }))
    }

    return Quote.parse(input)
  }

  public static fromQuote(quote: Quote, { withAttachments = true } = {}): QuoteBuilder {
    if (![QuoteStatus.Expired, QuoteStatus.Rejected].includes(quote.status)) {
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
    builder.events = [Event.parse({ type: 'quote-drafted', from: 'quote' })]
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
      ![QuoteStatus.Accepted, QuoteStatus.Closed, QuoteStatus.Rejected].includes(this._status) &&
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

    if (new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1) {
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
      new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1
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
      new Set(this._items.map((item) => item.taxRate).filter((rate) => rate !== 0)).size > 1
    ) {
      throw new Error(
        'You already had discounts configured, but this is not supported for mixed tax rates right now',
      )
    }

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
