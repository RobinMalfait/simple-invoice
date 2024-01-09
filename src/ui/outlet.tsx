import { cloneElement, createContext, useContext } from 'react'

let Context = createContext<React.ReactElement | null>(null)

function useOutlet() {
  let context = useContext(Context)
  if (context === null) {
    let err = new Error('useOutlet() is used, but there is no parent <OutletProvider /> found.')
    if (Error.captureStackTrace) Error.captureStackTrace(err, useOutlet)
    throw err
  }
  return context
}

export function OutletProvider({
  value,
  children,
}: React.PropsWithChildren<{ value: React.ReactElement }>) {
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function Outlet<T extends React.ElementType>(props: React.ComponentProps<T>) {
  let outlet = useOutlet()
  return <>{cloneElement(outlet, props)}</>
}
