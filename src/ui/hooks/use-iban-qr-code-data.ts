import z from 'zod'
import { Currency } from '~/domain/currency/currency'
import { Record } from '~/domain/record/record'
import { total } from '~/ui/invoice/total'
import { useTranslation } from './use-translation'

let data = z.object({
  type: z.literal('invoice'),
  currency: z.literal(Currency.EUR).transform((value) => value.toUpperCase()),

  // SPEC: https://www.europeanpaymentscouncil.eu/sites/default/files/KB/files/EPC069-12%20v2.1%20Quick%20Response%20Code%20-%20Guidelines%20to%20Enable%20the%20Data%20Capture%20for%20the%20Initiation%20of%20a%20SCT.pdf
  serviceTag: z.literal('BCD').default('BCD'), // BCD = Biller Credit Transfer
  version: z.enum(['001', '002']).default('002'), // 001 = Version 1, 002 = Version 2
  characterSet: z
    .enum([
      '1', // UTF-8
      '2', // ISO 8859-1
      '3', // ISO 8859-2
      '4', // ISO 8859-4
      '5', // ISO 8859-5
      '6', // ISO 8859-7
      '7', // ISO 8859-10
      '8', // ISO 8859-15
    ])
    .default('1'), // 1 = UTF-8
  identification: z.literal('SCT').default('SCT'), // SCT = SEPA Credit Transfer
  bic: z.string().max(11).optional(),
  name: z.string().max(70),
  iban: z
    .string()
    .max(34)
    .transform((value) => value.toUpperCase().replace(/\s/g, '')),
  amount: z
    .number()
    .min(10) // In cents
    .max(99999999999) // In cents
    .transform((value) => `EUR${(value / 100).toFixed(2)}`),
  purpose: z.string().max(4).optional(),
  remittanceReference: z.string().max(35).optional(), // Structured reference
  remittanceText: z.string().max(140).optional(), // Unstructured reference
  beneficiaryInformation: z.string().max(70).optional(),
})

export function useIbanQrCodeData(record: Record): string | null {
  let t = useTranslation()
  let result = data.safeParse({
    type: record.type,
    currency: record.client.currency,

    name: record.account.name,
    iban: record.account.paymentMethods.find((method) => method.type === 'iban')?.value,
    amount: total(record),
    remittanceText: [
      `${t((x) => x.invoice.title)}: #${record.number}`,
      `#${record.number}`,
      '',
    ].find((text) => text.length <= 140),
  })

  if (result.success === false) {
    console.warn(result.error.issues)
    return null
  }

  return [
    result.data.serviceTag,
    result.data.version,
    result.data.characterSet,
    result.data.identification,
    result.data.bic,
    result.data.name,
    result.data.iban,
    result.data.amount,
    result.data.purpose,
    result.data.remittanceReference,
    result.data.remittanceText,
    result.data.beneficiaryInformation,
  ]
    .map((value) => value ?? '')
    .join('\u000A')
    .trim()
}
