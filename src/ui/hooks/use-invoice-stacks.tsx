import { createContext, useContext } from 'react'

let InvoiceStacksContext = createContext<Record<string, string[]>>({})

export function InvoiceStacksProvider({
  value,
  ...props
}: React.PropsWithChildren<{ value: Record<string, string[]> }>) {
  return <InvoiceStacksContext.Provider value={value} {...props} />
}

export function useInvoiceStacks() {
  return useContext(InvoiceStacksContext)
}
