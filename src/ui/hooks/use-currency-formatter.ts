'use client'

import { useEffect, useState } from 'react'

import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'
import { useI18N } from '~/ui/hooks//use-i18n'
import { match } from '~/utils/match'

function createCurrencyFormatter(
  currency: Currency = Currency.EUR,
  language: Language = Language.EN,
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
      minimumFractionDigits: 2,
    },
  )
}

export function useCurrencyFormatter() {
  let { currency, language } = useI18N()
  let [formatter, setFormatter] = useState(() => createCurrencyFormatter(currency, language))

  useEffect(() => {
    setFormatter(createCurrencyFormatter(currency, language))
  }, [currency, language])

  return formatter
}
