import { addDays, parseISO } from 'date-fns'
import { z } from 'zod'

import { Account, accountSchema } from '~/domain/account/account'
import { Client, clientSchema } from '~/domain/client/client'
import { IncrementStrategy } from '~/domain/invoice/number-strategies'
import { InvoiceItem, invoiceItemSchema } from './invoice-item'

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

export let invoiceSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  number: z.string(),
  account: accountSchema,
  client: clientSchema,
  items: z.array(invoiceItemSchema),
  note: z.string().nullable(),
  issueDate: z.date(),
  dueDate: z.date(),
})

export type Invoice = z.infer<typeof invoiceSchema>

export class InvoiceBuilder {
  private _number: string | null = null
  private _account: Account | null = null
  private _client: Client | null = null
  private _items: InvoiceItem[] = []
  private _note: string | null = null
  private _issueDate: Date | null = null
  private _dueDate: Date | null = null

  public build(): Invoice {
    return invoiceSchema.parse({
      number: this._number ?? configuration.numberStrategy(this._issueDate!),
      account: this._account,
      client: this._client,
      items: this._items,
      note: this._note,
      issueDate: this._issueDate,
      dueDate: this._dueDate ?? configuration.defaultNetStrategy(this._issueDate!),
    })
  }

  public number(number: string): InvoiceBuilder {
    this._number = number
    return this
  }

  public account(account: Account): InvoiceBuilder {
    this._account = account
    return this
  }

  public client(client: Client): InvoiceBuilder {
    this._client = client
    return this
  }

  public items(items: InvoiceItem[]): InvoiceBuilder {
    this._items = items
    return this
  }

  public note(note: string | null): InvoiceBuilder {
    this._note = note
    return this
  }

  public issueDate(issueDate: string | Date): InvoiceBuilder {
    this._issueDate = typeof issueDate === 'string' ? parseISO(issueDate) : issueDate
    return this
  }

  public dueDate(dueDate: string | Date): InvoiceBuilder {
    this._dueDate = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
    return this
  }

  public item(item: InvoiceItem): InvoiceBuilder {
    this._items.push(item)
    return this
  }
}
