import { createContext, useContext } from 'react'

let RecordStacksContext = createContext<Record<string, string[]>>({})

export function RecordStacksProvider({
  value,
  ...props
}: React.PropsWithChildren<{ value: Record<string, string[]> }>) {
  return <RecordStacksContext.Provider value={value} {...props} />
}

export function useRecordStacks() {
  return useContext(RecordStacksContext)
}
