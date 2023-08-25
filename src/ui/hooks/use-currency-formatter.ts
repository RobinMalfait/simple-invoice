'use client'

import { useEffect, useState } from 'react'

import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'
import { useI18N } from '~/ui/hooks//use-i18n'
import { match } from '~/utils/match'

function createCurrencyFormatter(
  currency: Currency = Currency.EUR,
  language: Language = Language.EN,
  type: 'short' | 'long' = 'long',
) {
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

export function useCurrencyFormatter({ type = 'long' }: { type?: 'short' | 'long' } = {}) {
  let { currency, language } = useI18N()
  let [formatter, setFormatter] = useState(() => createCurrencyFormatter(currency, language, type))

  useEffect(() => {
    setFormatter(createCurrencyFormatter(currency, language, type))
  }, [currency, language, type])

  return formatter
}
