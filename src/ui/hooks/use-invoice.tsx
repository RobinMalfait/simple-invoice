'use client'

import { ReactNode, createContext, useContext } from 'react'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { pick } from '~/utils/pick'

type Entity = Quote | Invoice
let Context = createContext<Entity | null>(null)

export function InvoiceProvider({ invoice, children }: { invoice: Entity; children: ReactNode }) {
  return (
    <I18NProvider value={pick(invoice.client, ['currency', 'language'])}>
      <Context.Provider value={invoice}>{children}</Context.Provider>
    </I18NProvider>
  )
}

export function useInvoice() {
  let invoice = useContext(Context)
  if (invoice === null) {
    let err = new Error('useInvoice() is used, but there is no parent <InvoiceProvider /> found.')
    if (Error.captureStackTrace) Error.captureStackTrace(err, useInvoice)
    throw err
  }
  return invoice
}
