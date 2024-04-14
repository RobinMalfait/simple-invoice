import { Currency } from '~/domain/currency/currency'
import type { Transaction, TransactionBuilder } from '~/domain/transaction/transaction'

import * as coda from '~/domain/transaction/import/coda'
import * as bnp from '~/domain/transaction/import/csv--bnp-paribas-fortis'
import * as kbc from '~/domain/transaction/import/csv--kbc'
import * as mint from '~/domain/transaction/import/csv--mint'

let importers = [coda, kbc, bnp, /* mint */]

export function parseTransactions(
  filepath: string,
  transform: (
    builder: TransactionBuilder,
    normalized: {
      amount: number
      date: Date
      supplier: string
      currency: Currency
      summary: string
    },
  ) => void,
): Transaction[] {
  for (let importer of importers) {
    if (importer.check(filepath)) {
      return importer.handle(filepath, transform)
    }
  }
  return []
}
