'use client'

import { useCallback } from 'react'

import { Language } from '~/domain/language/language'
import { useI18N } from '~/ui/hooks/use-i18n'

import EN_INVOICE from '~/data/translations/en/invoice.json'
import NL_INVOICE from '~/data/translations/nl/invoice.json'

type Translation = typeof NL_INVOICE & typeof EN_INVOICE

const translations: Record<Language, Translation> = {
  [Language.NL]: Object.assign({}, NL_INVOICE),
  [Language.EN]: Object.assign({}, EN_INVOICE),
}

// ---

export function useTranslation() {
  let { language } = useI18N()

  return useCallback(
    (
      key: (value: Translation) => string,
      interpolations: Record<string, string | { toString: () => string }> = {},
    ) => {
      let value = key(translations[language])
      for (let key in interpolations) {
        value = value.replace(`:${key}`, `${interpolations[key]}`)
      }
      return value
    },
    [language],
  )
}
