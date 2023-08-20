import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { match } from '~/utils/match'

export type Record = Quote | Invoice | Receipt

// We have 1 big list of all the quotes, invoices and receipts. However, when we show the overview,
// we only want 1 record to be present for each invoice. So we squash the list such that only 1
// record is present instead of 2 or 3 (quote, invoice, receipt).
export function squashRecords(records: Record[]): Record[] {
  let all = records.slice()
  let toRemove = new Set<string>()

  for (let record of records) {
    if (record.type === 'invoice' && record.quote) {
      toRemove.add(record.quote.id)
    } else if (record.type === 'receipt') {
      toRemove.add(record.invoice.id)
      if (record.invoice.quote) toRemove.add(record.invoice.quote.id)
    }
  }

  for (let record of toRemove) {
    let idx = all.findIndex((e) => e.id === record)
    if (idx !== -1) all.splice(idx, 1)
  }

  return all
}

export function resolveRelevantRecordDate(record: Record) {
  return match(
    record.type,
    {
      quote: (r: Quote) => r.quoteDate,
      invoice: (r: Invoice) => r.issueDate,
      receipt: (r: Receipt) => r.invoice.issueDate,
    },
    record,
  )
}
