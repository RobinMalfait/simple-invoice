'use client'

import { ReactNode, createContext, useContext } from 'react'
import type { Record } from '~/domain/record/record'

let Context = createContext<Record[] | null>(null)

export function RecordsProvider({ records, children }: { records: Record[]; children: ReactNode }) {
  return <Context.Provider value={records}>{children}</Context.Provider>
}

export function useRecords() {
  let records = useContext(Context)
  if (records === null) {
    let err = new Error('useRecords() is used, but there is no parent <RecordsProvider /> found.')
    if (Error.captureStackTrace) Error.captureStackTrace(err, useRecords)
    throw err
  }
  return records
}
