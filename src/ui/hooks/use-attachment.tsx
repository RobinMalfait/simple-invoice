'use client'

import { createContext, useContext } from 'react'
import { Document } from '~/domain/document/document'

let Context = createContext<Document | null>(null)

export function AttachmentProvider({
  document,
  children,
}: React.PropsWithChildren<{ document: Document }>) {
  return <Context.Provider value={document}>{children}</Context.Provider>
}

export function useAttachment() {
  let attachment = useContext(Context)
  if (attachment === null) {
    let err = new Error(
      'useAttachment() is used, but there is no parent <AttachmentProvider /> found.',
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useAttachment)
    throw err
  }
  return attachment
}
