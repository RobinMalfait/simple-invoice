// https://www.europeanpaymentscouncil.eu/sites/default/files/KB/files/EPC069-12%20v2.1%20Quick%20Response%20Code%20-%20Guidelines%20to%20Enable%20the%20Data%20Capture%20for%20the%20Initiation%20of%20a%20SCT.pdf

import { isInvoice } from '~/domain/record/filters'
import { Record } from '~/domain/record/record'
import { total } from '~/ui/invoice/total'

export function useIbanQrCodeData(record: Record): string | null {
  // We are only interested in invoices
  if (!isInvoice(record)) {
    return null
  }

  let name = record.account.name
  if (name.length > 70) {
    return null
  }

  let iban = record.account.paymentMethods.find((method) => method.type === 'iban')
  if (iban == null) {
    return null
  }

  let formattedIban = iban.value.toUpperCase().replace(/\s/g, '')
  if (formattedIban.length > 34) {
    return null
  }

  let amount = total(record)
  if (amount < 10 || amount > 999999999999) {
    return null
  }

  let remittanceTextOptions = [`Invoice: #${record.number}`, `#${record.number}`, '']
  let remittanceText = remittanceTextOptions.find((text) => text.length <= 140)

  return [
    'BCD', // Service Tag
    '002', // Version
    '1', // Character set
    'SCT', // Identification
    '', // BIC (optional in version 2)
    name, // Name
    formattedIban, // IBAN
    `${record.client.currency.toUpperCase()}${(amount / 100).toFixed(2)}`, // Amount
    '', // Purpose
    '', // Remittance (Reference)
    remittanceText, // Remittance (Text)
    '', // Information
  ]
    .join('\u000A')
    .trim()
}
