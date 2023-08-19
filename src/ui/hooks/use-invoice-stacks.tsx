import { createContext, useContext } from 'react'

let InvoiceStacksContext = createContext<Map<string, string[]>>(new Map())

export function InvoiceStacksProvider({
  value,
  ...props
}: React.PropsWithChildren<{ value: Map<string, string[]> }>) {
  return <InvoiceStacksContext.Provider value={value} {...props} />
}

export function useInvoiceStacks() {
  return useContext(InvoiceStacksContext)
}
