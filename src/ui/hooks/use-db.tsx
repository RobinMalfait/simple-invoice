'use client'

import { createContext, useContext, type ContextType, type ReactNode } from 'react'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'

let Context = createContext<{
  clientById: Map<string, Client>
  accountById: Map<string, Account>
  quoteById: Map<string, Quote>
  invoiceById: Map<string, Invoice>
  receiptById: Map<string, Receipt>
} | null>(null)

export function DatabaseProvider({
  db,
  children,
}: {
  db: NonNullable<ContextType<typeof Context>>
  children: ReactNode
}) {
  return <Context.Provider value={db}>{children}</Context.Provider>
}

export function useDatabase() {
  let db = useContext(Context)
  if (db === null) {
    let err = new Error('useDatabase() is used, but there is no parent <DatabaseProvider /> found.')
    if (Error.captureStackTrace) Error.captureStackTrace(err, useDatabase)
    throw err
  }
  return db
}
