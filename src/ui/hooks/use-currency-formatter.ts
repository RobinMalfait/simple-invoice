'use client'

import { useEffect, useState } from 'react'

import { useI18N } from '~/ui/hooks//use-i18n'
import { createCurrencyFormatter } from '~/utils/currency-formatter'

export function useCurrencyFormatter({ type = 'long' }: { type?: 'short' | 'long' } = {}) {
  let { currency, language } = useI18N()
  let [formatter, setFormatter] = useState(() =>
    createCurrencyFormatter({ currency, language, type }),
  )

  useEffect(() => {
    setFormatter(createCurrencyFormatter({ currency, language, type }))
  }, [currency, language, type])

  return formatter
}
