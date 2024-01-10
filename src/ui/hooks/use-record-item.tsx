'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Record } from '~/domain/record/record'

let Context = createContext<Record['items'][number] | null>(null)

export function RecordItemProvider({
  item,
  children,
}: {
  item: Record['items'][number]
  children: ReactNode
}) {
  return <Context.Provider value={item}>{children}</Context.Provider>
}

export function useRecordItem() {
  let record = useContext(Context)
  if (record === null) {
    let err = new Error(
      'useRecordItem() is used, but there is no parent <RecordItemProvider /> found.',
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useRecordItem)
    throw err
  }
  return record
}
