import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { isInvoice, isQuote, isReceipt } from '~/domain/record/filters'
import { match } from '~/utils/match'

export type Record = Quote | Invoice | Receipt

function* _separateRecords(records: Record[]): Generator<Record> {
  for (let record of records) {
    yield record

    if (isQuote(record) && record.quote) {
      yield* _separateRecords([record.quote])
    } else if (isInvoice(record) && record.quote) {
      yield* _separateRecords([record.quote])
    } else if (isReceipt(record) && record.invoice) {
      yield* _separateRecords([record.invoice])
    }
  }
}

export function separateRecords(records: Record[]) {
  return Array.from(_separateRecords(records)).filter((record, idx, all) => {
    return (
      all.findIndex((other) => {
        return other.id === record.id
      }) === idx
    )
  })
}

function* _combineRecords(records: Record[]): Generator<string> {
  for (let record of records) {
    if (isQuote(record) && record.quote) {
      yield record.quote.id
      yield* _combineRecords([record.quote])
    } else if (isInvoice(record) && record.quote) {
      yield record.quote.id
      yield* _combineRecords([record.quote])
    } else if (isReceipt(record) && record.invoice) {
      yield record.invoice.id
      yield* _combineRecords([record.invoice])
    }
  }
}

export function combineRecords(records: Record[]): Record[] {
  let all = records.slice()
  let toRemove = new Set<string>(_combineRecords(records))

  for (let record of toRemove) {
    let idx = all.findIndex((e) => {
      return e.id === record
    })
    if (idx !== -1) all.splice(idx, 1)
  }

  return all
}

export function resolveRelevantRecordDate(record: Record) {
  return match(
    record.type,
    {
      quote: (r: Quote) => {
        return r.quoteDate
      },
      invoice: (r: Invoice) => {
        return r.issueDate
      },
      receipt: (r: Receipt) => {
        return r.invoice.issueDate
      },
    },
    record,
  )
}
