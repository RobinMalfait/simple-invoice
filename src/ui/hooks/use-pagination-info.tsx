'use client'

import { ReactNode, createContext, useContext } from 'react'

let Context = createContext<Pagination | null>(null)

export interface Pagination {
  /** Total amount of pages */
  total: number

  /** Current page, first page = 0 */
  current: number
}

export function PageProvider({ info, children }: { info: Pagination; children: ReactNode }) {
  return <Context.Provider value={info}>{children}</Context.Provider>
}

export function usePaginationInfo() {
  let invoice = useContext(Context)
  if (invoice === null) {
    let err = new Error(
      'usePaginationInfo() is used, but there is no parent <PageProvider /> found.',
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, usePaginationInfo)
    throw err
  }
  return invoice
}
