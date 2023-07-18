import { addDays, parseISO } from 'date-fns'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { IncrementStrategy } from '~/domain/invoice/number-strategies'
import { required } from '~/utils/required'

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

export type Invoice = {
  id: string
  number: string
  account: Account
  client: Client
  items: InvoiceItem[]
  note: string | null
  issueDate: Date
  dueDate: Date
}

export class InvoiceBuilder {
  private _number: string | null = null
  private _account: Account | null = null
  private _client: Client | null = null
  private _items: InvoiceItem[] = []
  private _note: string | null = null
  private _issueDate: Date | null = null
  private _dueDate: Date | null = null

  public build(): Invoice {
    let issueDate = this._issueDate ?? required('issueDate')

    return {
      id: crypto.randomUUID(),
      number: this._number ?? configuration.numberStrategy(issueDate),
      account: this._account ?? required('account'),
      client: this._client ?? required('client'),
      items: this._items ?? required('items'),
      note: this._note,
      issueDate,
      dueDate: this._dueDate ?? configuration.defaultNetStrategy(issueDate),
    }
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

// ---

export type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export class InvoiceItemBuilder {
  private _description: string | null = null
  private _quantity: number | null = 1
  private _unitPrice: number | null = null
  private _taxRate: number | null = 0

  public build(): InvoiceItem {
    return {
      id: crypto.randomUUID(),
      description: this._description ?? required('description'),
      quantity: this._quantity ?? required('quantity'),
      unitPrice: this._unitPrice ?? required('unitPrice'),
      taxRate: this._taxRate ?? required('taxRate'),
    }
  }

  public description(description: string): InvoiceItemBuilder {
    this._description = description
    return this
  }

  public quantity(quantity: number): InvoiceItemBuilder {
    this._quantity = quantity
    return this
  }

  public unitPrice(unitPrice: number): InvoiceItemBuilder {
    this._unitPrice = unitPrice
    return this
  }

  public taxRate(unitPrice: number): InvoiceItemBuilder {
    this._taxRate = unitPrice
    return this
  }
}
