import { parseISO } from 'date-fns'
import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Currency } from '~/domain/currency/currency'
import { TransactionStatus } from '~/domain/transaction/transaction-status'
import { ScopedIDGenerator } from '~/utils/id'
import { Client } from '../client/client'
import { Supplier } from '../supplier/supplier'

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
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.Completed),
  summary: z.string().nullable(),
  category: z.string().nullable(),
  date: z.date(),
  currency: z.nativeEnum(Currency),
  amount: z.number(),
  taxes: z.array(z.number()),
})

export type Transaction = z.infer<typeof Transaction>

export class TransactionBuilder {
  private _account: Transaction['account'] | null = null
  private _supplier: Transaction['supplier'] | null = null
  private _status: Transaction['status'] = TransactionStatus.Completed
  private _summary: Transaction['summary'] | null = null
  private _category: Transaction['category'] | null = null
  private _date: Transaction['date'] | null = null
  private _currency: Transaction['currency'] | null = null
  private _amount: Transaction['amount'] | null = null
  private _taxes: Transaction['taxes'] = []

  public build(): Transaction {
    return Transaction.parse({
      account: this._account,
      supplier: this._supplier,
      status: this._status,
      summary: this._summary,
      category: this._category,
      date: this._date,
      currency: this._currency,
      amount: this._amount,
      taxes: this._taxes,
    })
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

  public taxes(taxes: Transaction['taxes']): TransactionBuilder {
    this._taxes = taxes
    return this
  }

  public tax(tax: Transaction['taxes'][number]): TransactionBuilder {
    this._taxes.push(tax)
    return this
  }
}
