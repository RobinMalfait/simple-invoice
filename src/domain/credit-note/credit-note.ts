import EventEmitter from 'node:events'

import { parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Discount } from '~/domain/discount/discount'
import { Document } from '~/domain/document/document'
import { bus as defaultBus } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { Invoice } from '~/domain/invoice/invoice'
import { InvoiceItem } from '~/domain/invoice/invoice-item'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('credit-note')

export let CreditNote = z.object({
  type: z.literal('credit-note').default('credit-note'),
  id: z.string().default(() => {
    return scopedId.next()
  }),
  number: z.string(),
  invoice: z.lazy(() => {
    return Invoice
  }),
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
  creditNoteDate: z.date(),
  discounts: z.array(
    z.lazy(() => {
      return Discount
    }),
  ),
  attachments: z.array(
    z.lazy(() => {
      return Document
    }),
  ),
})

export type CreditNote = z.infer<typeof CreditNote>

export class CreditNoteBuilder {
  private _number: string | null = null
  private _invoice: Invoice | null = null
  private _account: Account | null = null
  private _client: Client | null = null
  private _items: InvoiceItem[] = []
  private _note: string | null = null
  private _creditNoteDate: Date | null = null
  private _discounts: Discount[] = []
  private _attachments: Document[] = []

  private _events: Partial<Event>[] = []

  public constructor(private bus: EventEmitter = defaultBus) {}

  private emit(event: Event) {
    this.bus.emit(event.type, event)
  }

  public build(): CreditNote {
    let creditNote = CreditNote.parse({
      number: this._number ?? `${this._invoice?.number}-CN` ?? null,
      invoice: this._invoice,
      account: this._account,
      client: this._client,
      items: this._items,
      note: this._note,
      creditNoteDate: this._creditNoteDate,
      discounts: this._discounts,
      attachments: this._attachments,
    })

    // Invert the values
    {
      creditNote.items = creditNote.items.map((item) => {
        return {
          ...item,
          discounts: item.discounts.map((discount) => {
            if (discount.type === 'fixed') {
              return { ...discount, value: discount.value * -1 }
            } else {
              return discount
            }
          }),
          unitPrice: item.unitPrice * -1,
        }
      })
      creditNote.discounts = creditNote.discounts.map((discount) => {
        if (discount.type === 'fixed') {
          return { ...discount, value: discount.value * -1 }
        } else {
          return discount
        }
      })
    }

    for (let event of this._events) {
      this.emit(
        Event.parse({
          ...event,
          context: {
            ...event.context,
            accountId: creditNote.account.id,
            clientId: creditNote.client.id,
            invoiceId: creditNote.invoice.id,
            creditNoteId: creditNote.id,
          },
        }),
      )
    }

    return creditNote
  }

  public static fromInvoice(invoice: Invoice, { withAttachments = true } = {}): CreditNoteBuilder {
    let builder = new CreditNoteBuilder()
    builder._invoice = invoice
    builder._account = invoice.account
    builder._client = invoice.client
    builder._items = invoice.items.slice()
    builder._note = invoice.note
    builder._creditNoteDate = invoice.paidAt
    builder._discounts = invoice.discounts.slice()
    if (withAttachments) {
      builder._attachments = invoice.attachments.slice()
    }

    builder._events.push({ type: 'credit-note:created' })

    return builder
  }

  public number(number: string): CreditNoteBuilder {
    this._number = number
    return this
  }

  public note(note: string): CreditNoteBuilder {
    this._note = note
    return this
  }

  public creditNoteDate(creditNoteDate: string | Date): CreditNoteBuilder {
    this._creditNoteDate =
      typeof creditNoteDate === 'string' ? parseISO(creditNoteDate) : creditNoteDate
    return this
  }

  public attachments(attachments: Document[]): CreditNoteBuilder {
    this._attachments = attachments.slice()
    return this
  }

  public attachment(attachment: Document): CreditNoteBuilder {
    this._attachments.push(attachment)
    return this
  }
}
