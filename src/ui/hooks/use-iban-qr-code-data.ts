import z from 'zod'
import { Currency } from '~/domain/currency/currency'
import type { Record } from '~/domain/record/record'
import { useTranslation } from '~/ui/hooks/use-translation'
import { total } from '~/ui/invoice/total'

enum ServiceTag {
  BCD = 'BCD', // Business Card Data
}

enum Version {
  V1 = '001',
  V2 = '002',
}

enum CharacterSet {
  UTF_8 = '1',
  ISO_8859_1 = '2',
  ISO_8859_2 = '3',
  ISO_8859_4 = '4',
  ISO_8859_5 = '5',
  ISO_8859_7 = '6',
  ISO_8859_10 = '7',
  ISO_8859_15 = '8',
}

enum Identification {
  SCT = 'SCT', // SEPA Credit Transfer
}

let data = z.object({
  type: z.literal('invoice'),
  currency: z.literal(Currency.EUR).transform((value) => {
    return value.toUpperCase()
  }),

  // SPEC: https://www.europeanpaymentscouncil.eu/sites/default/files/KB/files/EPC069-12%20v2.1%20Quick%20Response%20Code%20-%20Guidelines%20to%20Enable%20the%20Data%20Capture%20for%20the%20Initiation%20of%20a%20SCT.pdf
  serviceTag: z.nativeEnum(ServiceTag).default(ServiceTag.BCD),
  version: z.nativeEnum(Version).default(Version.V2),
  characterSet: z.nativeEnum(CharacterSet).default(CharacterSet.UTF_8),
  identification: z.nativeEnum(Identification).default(Identification.SCT),
  bic: z.string().max(11).optional(),
  name: z.string().max(70),
  iban: z
    .string()
    .max(34)
    .transform((value) => {
      return value.toUpperCase().replace(/\s/g, '')
    }),
  amount: z
    .number()
    .min(10) // In cents
    .max(999_999_999_99) // In cents
    .transform((value) => {
      return `EUR${(value / 100).toFixed(2)}`
    }),
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
    iban: record.account.paymentMethods.find((method) => {
      return method.type === 'iban'
    })?.value,
    amount: total(record),
    remittanceText: [
      `${t((x) => {
        return x.invoice.title
      })}: #${record.number}`,
      `#${record.number}`,
      '',
    ].find((text) => {
      return text.length <= 140
    }),
  })

  if (result.success === false) {
    console.warn(`Failed to generate IBAN QR code data for record #${record.id}`, {
      issues: result.error.issues,
    })
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
    .map((value) => {
      return value ?? ''
    })
    .join('\u000A') // LF
    .trim()
}
