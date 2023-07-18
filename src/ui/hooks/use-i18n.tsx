'use client'

import { createContext, useContext } from 'react'

import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'

let Context = createContext<{ language: Language; currency: Currency } | null>(null)

export function I18NProvider(props: {
  value: { language: Language; currency: Currency } | null
  children: React.ReactNode
}) {
  return <Context.Provider value={props.value}>{props.children}</Context.Provider>
}

export function useI18N() {
  let i18n = useContext(Context)
  if (i18n === null) {
    let err = new Error('useI18N() is used, but there is no parent <I18NProvider /> found.')
    if (Error.captureStackTrace) Error.captureStackTrace(err, useI18N)
    throw err
  }
  return i18n
}
