import { parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { CreditNote } from '~/domain/credit-note/credit-note'
import { Currency } from '~/domain/currency/currency'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { Supplier } from '~/domain/supplier/supplier'
import { TransactionStatus } from '~/domain/transaction/transaction-status'
import { total } from '~/ui/invoice/total'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('transaction')

export let Transaction = z.object({
  id: z.string().default(() => {
    return scopedId.next()
  }),
  account: z.lazy(() => {
    return Account
  }),
  supplier: z.lazy(() => {
    return z.union([Supplier, Client])
  }),
  record: z
    .lazy(() => {
      return z.union([Quote, Invoice, CreditNote, Receipt])
    })
    .optional()
    .nullable()
    .default(null),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.Completed),
  summary: z.string().nullable(),
  category: z.string().nullable(),
  date: z.date(),
  currency: z.nativeEnum(Currency),
  amount: z.number(),
})

export type Transaction = z.infer<typeof Transaction>

export class TransactionBuilder {
  private _account: Transaction['account'] | null = null
  private _supplier: Transaction['supplier'] | null = null
  private _record: Transaction['record'] | null = null
  private _status: Transaction['status'] = TransactionStatus.Completed
  private _summary: Transaction['summary'] | null = null
  private _category: Transaction['category'] | null = null
  private _date: Transaction['date'] | null = null
  private _currency: Transaction['currency'] | null = null
  private _amount: Transaction['amount'] | null = null

  public build(): Transaction {
    return Transaction.parse({
      account: this._account,
      supplier: this._supplier,
      record: this._record,
      status: this._status,
      summary: this._summary,
      category: this._category,
      date: this._date,
      currency: this._currency,
      amount: this._amount,
    })
  }

  static forRecord(record: NonNullable<Transaction['record']>): TransactionBuilder {
    return new TransactionBuilder()
      .account(record.account)
      .supplier(record.client)
      .record(record)
      .summary(`Payment for ${record.type} #${record.number}`)
      .amount(total(record))
  }

  public account(account: Transaction['account']): TransactionBuilder {
    this._account = account

    if (this._currency === null) {
      this._currency = account.currency
    }

    return this
  }

  public supplier(supplier: Transaction['supplier']): TransactionBuilder {
    this._supplier = supplier
    return this
  }

  public record(record: Transaction['record']): TransactionBuilder {
    this._record = record
    return this
  }

  public status(status: Transaction['status']): TransactionBuilder {
    this._status = status
    return this
  }

  public summary(summary: Transaction['summary']): TransactionBuilder {
    this._summary = summary
    return this
  }

  public category(category: Transaction['category']): TransactionBuilder {
    this._category = category
    return this
  }

  public date(date: Transaction['date'] | string): TransactionBuilder {
    this._date = typeof date === 'string' ? parseISO(date) : date
    return this
  }

  public currency(currency: Transaction['currency']): TransactionBuilder {
    this._currency = currency
    return this
  }

  public amount(amount: Transaction['amount']): TransactionBuilder {
    this._amount = amount
    return this
  }
}
