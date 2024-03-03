// BNP Paribas Fortis

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
  summary(raw: any): string
} = {
  amount(raw) {
    return Math.round(Number(raw['Bedrag'].replace(',', '.')) * 100)
  },
  date(raw) {
    return parse(raw['Uitvoeringsdatum'], 'dd/MM/yyyy', new Date())
  },
  supplier(raw) {
    return raw['Naam van de tegenpartij'] || parseDescription(raw['Details']).supplier || ''
  },
  currency(raw) {
    return raw['Valuta rekening'].toLowerCase() === 'eur' ? Currency.EUR : Currency.USD
  },
  summary(raw) {
    return raw['Mededeling'] || parseDescription(raw['Details']).summary || ''
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

      transform?.(builder, normalized)

      return builder.build()
    },
    {},
  )
}

function parseDescription(input: string) {
  if (input.startsWith('STORTING CONTANTEN IN CASH DEPOSIT')) {
    let summary = /BANKREFERENTIE : (.*) VALUTADATUM/.exec(input)?.[1].trim() ?? null
    return {
      summary: summary ? `Cash deposit, referentie: ${summary}` : null,
      supplier: /IN HET (.*) SELF CASH/.exec(input)?.[1].trim() ?? null,
    }
  } else if (input.startsWith('OVERSCHRIJVING')) {
    return {
      summary: /MEDEDELING : (.*) BANKREFERENTIE/.exec(input)?.[1].trim() ?? null,
      supplier: /VIA MOBILE BANKING (.*) MEDEDELING/.exec(input)?.[1].trim() ?? null,
    }
  } else {
    console.log('Could not parse description:', { description: input })
    return {
      summary: input,
      supplier: null,
    }
  }
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

  csv(read(filepath), (record) => {
    for (let field of [
      'Bedrag',
      'Uitvoeringsdatum',
      'Naam van de tegenpartij',
      'Valuta rekening',
      'Mededeling',
    ]) {
      if (!(field in record)) {
        return
      }
    }

    valid = true
  })

  return valid
}

function read(filepath: string) {
  return fs.readFileSync(filepath, 'utf8')
}
