'use client'

import { ReactNode, createContext, useContext } from 'react'
import type { Record } from '~/domain/record/record'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { pick } from '~/utils/pick'

let Context = createContext<Record | null>(null)

export function RecordProvider({ record, children }: { record: Record; children: ReactNode }) {
  return (
    <I18NProvider value={pick(record.client, ['currency', 'language'])}>
      <Context.Provider value={record}>{children}</Context.Provider>
    </I18NProvider>
  )
}

export function useRecord() {
  let record = useContext(Context)
  if (record === null) {
    let err = new Error('useRecord() is used, but there is no parent <RecordProvider /> found.')
    if (Error.captureStackTrace) Error.captureStackTrace(err, useRecord)
    throw err
  }
  return record
}
