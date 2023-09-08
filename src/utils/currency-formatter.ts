import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'
import { match } from '~/utils/match'

export function createCurrencyFormatter({
  currency = Currency.EUR,
  language = Language.EN,
  type = 'long',
}: {
  currency?: Currency
  language?: Language
  type?: 'short' | 'long'
}) {
  return new Intl.NumberFormat(
    match(language, {
      [Language.EN]: 'en',
      [Language.NL]: 'nl',
    }),
    {
      style: 'currency',
      currency: match(currency, {
        [Currency.USD]: 'USD',
        [Currency.EUR]: 'EUR',
      }),
      notation: type === 'short' ? 'compact' : 'standard',
      minimumFractionDigits: type === 'short' ? 0 : 2,
      maximumFractionDigits: type === 'short' ? 0 : 2,
      // @ts-expect-error TypeScript is not aware of this yet
      roundingMode: type === 'short' ? 'halfFloor' : 'halfExpand',
    },
  )
}
