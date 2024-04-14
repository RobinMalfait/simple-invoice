// Mint

import { parse } from 'date-fns'
import fs from 'fs'
import { Currency } from '~/domain/currency/currency'
import { csv } from '~/domain/transaction/import/utils'
import { Transaction, TransactionBuilder } from '~/domain/transaction/transaction'

let normalizers: {
  amount(raw: any): number
  date(raw: any): Date
  supplier(raw: any): string
  currency(raw: any): Currency
  category(raw: any): string
  summary(raw: any): string
} = {
  amount(raw) {
    let multiplier = raw['Transaction Type'] === 'credit' ? 1 : -1

    return multiplier * Math.round(Number(raw['Amount']) * 100)
  },
  date(raw) {
    return parse(raw['Date'], 'MM/dd/yyyy', new Date())
  },
  supplier(raw) {
    return raw['Account Name'] || ''
  },
  currency() {
    return Currency.USD
  },
  category(raw) {
    return raw['Category'] || ''
  },
  summary(raw) {
    return raw['Description'] || ''
  },
}

export function handle(
  filepath: string,
  transform: (builder: TransactionBuilder, normalized: ReturnType<typeof normalize>) => void,
): Transaction[] {
  return csv(
    read(filepath),
    (record) => {
      let builder = new TransactionBuilder()
      let normalized = normalize(record)

      builder
        .amount(normalized.amount)
        .date(normalized.date)
        .currency(normalized.currency)
        .summary(normalized.summary)
        .category(normalized.category)

      transform?.(builder, normalized)

      return builder.build()
    },
    {
      delimiter: ',',
    },
  )
}

function normalize(raw: any) {
  return Object.assign(
    Object.fromEntries(
      Object.entries(normalizers).map(([key, normalizer]) => {
        return [key, normalizer(raw)] as const
      }),
    ),
    { raw },
  ) as { raw: any } & { [K in keyof typeof normalizers]: ReturnType<(typeof normalizers)[K]> }
}

export function check(filepath: string) {
  let valid = false

  csv(
    read(filepath),
    (record) => {
      for (let field of [
        'Date',
        'Description',
        'Original Description',
        'Amount',
        'Transaction Type',
        'Category',
        'Account Name',
        'Labels',
        'Notes',
      ]) {
        if (!(field in record)) {
          return
        }
      }

      valid = true
    },
    {
      delimiter: ',',
    },
  )

  return valid
}

function read(filepath: string) {
  return fs.readFileSync(filepath, 'utf8')
}
