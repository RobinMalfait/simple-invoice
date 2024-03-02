// KBC

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
    return 'kredietkaart' in raw
      ? Math.round(Number(raw['bedrag in EUR'].replace(',', '.')) * 100)
      : Math.round(Number(raw['Bedrag'].replace(',', '.')) * 100)
  },
  date(raw) {
    return 'kredietkaart' in raw
      ? parse(raw['Datum verrekening'], 'dd/MM/yyyy', new Date())
      : parse(raw['Datum'], 'dd/MM/yyyy', new Date())
  },
  supplier(raw) {
    return 'kredietkaart' in raw
      ? raw['Handelaar']
      : raw['Naam tegenpartij'] || parseDescription(raw['Omschrijving']).supplier || ''
  },
  currency(raw) {
    return 'kredietkaart' in raw
      ? Currency.EUR
      : raw['Munt'].toLowerCase() === 'eur'
        ? Currency.EUR
        : Currency.USD
  },
  summary(raw) {
    return 'kredietkaart' in raw
      ? raw['toelichting']
      : raw['Vrije mededeling'] || parseDescription(raw['Omschrijving']).summary || ''
  },
}

export function handle(
  filepath: string,
  transform: (builder: TransactionBuilder, normalized: ReturnType<typeof normalize>) => void,
): Transaction[] {
  return csv(read(filepath), (record) => {
    let builder = new TransactionBuilder()
    let normalized = normalize(record)

    builder
      .amount(normalized.amount)
      .date(normalized.date)
      .currency(normalized.currency)
      .summary(normalized.summary)

    transform?.(builder, normalized)

    return builder.build()
  })
}

function parseDescription(input: string = '') {
  if (input.startsWith('AFREKENING')) {
    return {
      summary: null,
      supplier: /AFREKENING\s+\d{2}-\d{2} (.*) UITGAVENSTAAT/.exec(input)?.[1].trim() ?? null,
    }
  } else if (input.startsWith('BETALING VIA BANCONTACT')) {
    return {
      summary: input.split(':').pop()?.trim(),
      supplier:
        /UUR (.*) [A-Z]{2}\d{4,}/.exec(input)?.[1].trim() ??
        /UUR (.*) MET/.exec(input)?.[1].trim() ??
        null,
    }
  } else if (input.startsWith('DOORLOPENDE BETALINGSOPDRACHT')) {
    return {
      summary: input.split(':').pop()?.trim(),
      supplier: /OVERSCHRIJVING NAAR (.*) BANKIER/.exec(input)?.[1].trim() ?? null,
    }
  } else if (input.startsWith('EUROPESE DOMICILIERING')) {
    return {
      summary: /EIGEN OMSCHR.\s*: (.*)MEDEDELING/.exec(input)?.[1].trim() ?? null,
      supplier: /SCHULDEISER([\s:]*)(.*)(\s*)REF. SCHULDEISER/.exec(input)?.[2].trim() ?? null,
    }
  } else if (input.startsWith('INSTANTOVERSCHRIJVING NAAR')) {
    return {
      summary: null,
      supplier: /BANKIER BEGUNSTIGDE: [^\s]+ (.*) [^\s]+ OM/.exec(input)?.[1].trim() ?? null,
    }
  } else if (input.startsWith('INSTANTOVERSCHRIJVING VAN')) {
    return { summary: null, supplier: /BANKIER OPDRACHTGEVER: [^\s]+ ([^\s]+[^\s])/ }
  } else if (input.startsWith('OVERSCHRIJVING NAAR')) {
    return {
      summary: null,
      supplier: /BANKIER BEGUNSTIGDE: [^\s]+ (.*)(\s\d*)? MET/.exec(input)?.[1].trim() ?? null,
    }
    // } else if (input.startsWith('OVERSCHRIJVING VAN')) {
    //   return { summary: null, supplier: null }
  } else if (input.startsWith('BIJDRAGE')) {
    return {
      summary: null,
      supplier: /\d{2}-\d{2} (.*?) GEDEELTE/g.exec(input)?.[1].trim() ?? null,
    }
  } else if (input.startsWith('VERBRUIK')) {
    return {
      summary: null,
      supplier: /\d{2}-\d{2} (.*) ZIE BIJLAGE/g.exec(input)?.[1].trim() ?? null,
    }
  } else {
    console.log('-->', input)
    throw new Error('Not implemented yet.')
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

function read(filepath: string) {
  return fs.readFileSync(filepath, 'latin1')
}

export function check(filepath: string) {
  let valid = false

  csv(read(filepath), (record) => {
    if ('kredietkaart' in record) {
      for (let field of ['bedrag in EUR', 'Datum verrekening', 'Handelaar', 'toelichting']) {
        if (!(field in record)) {
          return
        }
      }
    } else {
      for (let field of [
        'Bedrag',
        'Datum',
        'Naam tegenpartij',
        'Munt',
        'Vrije mededeling',
        'Omschrijving',
      ]) {
        if (!(field in record)) {
          return
        }
      }
    }

    valid = true
    return
  })

  return valid
}
