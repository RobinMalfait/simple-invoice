import { parseISO } from 'date-fns'
import { z } from 'zod'

import EventEmitter from 'node:events'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Discount } from '~/domain/discount/discount'
import { Document } from '~/domain/document/document'
import { bus as defaultBus } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { Invoice } from '~/domain/invoice/invoice'
import { InvoiceItem } from '~/domain/invoice/invoice-item'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { total } from '~/ui/invoice/total'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('receipt')

export let Receipt = z.object({
  type: z.literal('receipt').default('receipt'),
  id: z.string().default(() => scopedId.next()),
  number: z.string(),
  invoice: Invoice,
  account: Account,
  client: Client,
  items: z.array(InvoiceItem),
  note: z.string().nullable(),
  receiptDate: z.date(),
  discounts: z.array(Discount),
  attachments: z.array(Document),
  events: z.array(Event),
})

export type Receipt = z.infer<typeof Receipt>

export class ReceiptBuilder {
  private _number: string | null = null
  private _invoice: Invoice | null = null
  private _account: Account | null = null
  private _client: Client | null = null
  private _items: InvoiceItem[] = []
  private _note: string | null = null
  private _receiptDate: Date | null = null
  private _discounts: Discount[] = []
  private _attachments: Document[] = []
  private events: Receipt['events'] = []

  public constructor(private bus: EventEmitter = defaultBus) {}

  private emit(eventName: string, data: ReceiptBuilder | Receipt, at: Date | null = null) {
    this.bus.emit(eventName, {
      client: data instanceof ReceiptBuilder ? data._client : data.client,
      account: data instanceof ReceiptBuilder ? data._account : data.account,
      invoice: {
        number: data instanceof ReceiptBuilder ? data._invoice?.number : data.invoice.number,
        total: total({
          items: data instanceof ReceiptBuilder ? data._invoice!.items : data.invoice.items,
          discounts:
            data instanceof ReceiptBuilder ? data._invoice!.discounts : data.invoice.discounts,
        }),
        events: data instanceof ReceiptBuilder ? data._invoice!.events : data.invoice.events,
      },
      receipt: {
        number: data instanceof ReceiptBuilder ? data._number : data.number,
        total: total({
          items: data instanceof ReceiptBuilder ? data._items : data.items,
          discounts: data instanceof ReceiptBuilder ? data._discounts : data.discounts,
        }),
        events: data instanceof ReceiptBuilder ? data.events : data.events,
      },
      at,
    })
  }

  public build(): Receipt {
    return Receipt.parse({
      number: this._number ?? `${this._invoice?.number}-01` ?? null,
      invoice: this._invoice,
      account: this._account,
      client: this._client,
      items: this._items,
      note: this._note,
      receiptDate: this._receiptDate,
      discounts: this._discounts,
      attachments: this._attachments,
      events: this.events,
    })
  }

  public static fromInvoice(invoice: Invoice, { withAttachments = true } = {}): ReceiptBuilder {
    if (invoice.status !== InvoiceStatus.Paid) {
      throw new Error('Cannot create a receipt from an unpaid invoice')
    }

    let builder = new ReceiptBuilder()
    builder._invoice = invoice
    builder._account = invoice.account
    builder._client = invoice.client
    builder._items = invoice.items.slice()
    builder._note = invoice.note
    builder._receiptDate = invoice.events.find((e) => e.type === 'invoice-paid')?.at ?? null
    builder._discounts = invoice.discounts.slice()
    if (withAttachments) {
      builder._attachments = invoice.attachments.slice()
    }
    builder.events.push(Event.parse({ type: 'receipt-created' }))

    builder.emit('receipt:created', builder)

    return builder
  }

  public number(number: string): ReceiptBuilder {
    this._number = number
    return this
  }

  public receiptDate(receiptDate: string | Date): ReceiptBuilder {
    this._receiptDate = typeof receiptDate === 'string' ? parseISO(receiptDate) : receiptDate
    return this
  }

  public attachments(attachments: Document[]): ReceiptBuilder {
    this._attachments = attachments.slice()
    return this
  }

  public attachment(attachment: Document): ReceiptBuilder {
    this._attachments.push(attachment)
    return this
  }
}
