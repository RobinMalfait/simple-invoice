import { parse } from 'coda-parser'

// CODA
// Reference: https://docs.findock.com/coda-file-processing

import fs from 'fs'
import { Currency } from '~/domain/currency/currency'
import { Transaction, TransactionBuilder } from '~/domain/transaction/transaction'

let normalizers: {
  amount(raw: { amount: number }, extra: ReturnType<typeof parse>): number
  date(raw: { value_date: Date }, extra: ReturnType<typeof parse>): Date
  supplier(
    raw: { counterparty: { name: string } | null } | { counterparty: null },
    extra: ReturnType<typeof parse>,
  ): string
  currency(
    raw: ReturnType<typeof parse>['movements'][number],
    extra: ReturnType<typeof parse>,
  ): Currency
  summary(
    raw: { communication: string; transaction_code: { transaction_description: string } | null },
    extra: ReturnType<typeof parse>,
  ): string
} = {
  amount(raw) {
    return raw.amount * 100
  },
  date(raw) {
    return raw.value_date
  },
  supplier(raw, extra) {
    return (
      raw.counterparty?.name ??
      extra.balance.old.account.description ??
      `${extra?.header?.account?.name} (${extra.header.account.bic})`
    )
  },
  currency() {
    return Currency.EUR
  },
  summary(raw) {
    return raw.communication || raw.transaction_code?.transaction_description || ''
  },
}

export function handle(
  filepath: string,
  transform: (builder: TransactionBuilder, normalized: ReturnType<typeof normalize>) => void,
): Transaction[] {
  return coda(read(filepath), (record, raw) => {
    let builder = new TransactionBuilder()
    let normalized = normalize(record, raw)

    builder
      .amount(normalized.amount)
      .date(normalized.date)
      .currency(normalized.currency)
      .summary(normalized.summary)

    transform?.(builder, normalized)

    return builder.build()
  })
}

function coda<T>(
  raw: string,
  transform: (
    record: ReturnType<typeof parse>['movements'][number],
    raw: ReturnType<typeof parse>,
  ) => T,
): T[] {
  let parsed = parse(raw)
  return parsed.movements.map((record) => {
    return transform(record, parsed)
  })
}

function normalize(raw: any, extra: any) {
  return Object.assign(
    Object.fromEntries(
      Object.entries(normalizers).map(([key, normalizer]) => {
        return [key, normalizer(raw, extra)] as const
      }),
    ),
    { raw },
  ) as { raw: any } & { [K in keyof typeof normalizers]: ReturnType<(typeof normalizers)[K]> }
}

function read(filepath: string) {
  return fs.readFileSync(filepath, 'latin1')
}

export function check(filepath: string) {
  return filepath.endsWith('.cod')
}
