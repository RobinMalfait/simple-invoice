'use client'

import { createContext, Fragment, useContext, useEffect } from 'react'
import { classNames } from '~/ui/class-names'

let ClassifiedContext = createContext(true)

export function ClassifiedProvider(props: { children: React.ReactNode; value: boolean }) {
  useEffect(() => {
    if (props.value) {
      document.documentElement.dataset.classified = 'true'
    } else {
      delete document.documentElement.dataset.classified
    }
  }, [props.value])
  return (
    <ClassifiedContext.Provider value={props.value}>{props.children}</ClassifiedContext.Provider>
  )
}

export function useIsClassified() {
  return useContext(ClassifiedContext)
}

export function Classified(props: { children: React.ReactNode }) {
  let classified = useIsClassified()

  return (
    <>
      <span
        className={classNames(
          classified &&
            'pointer-events-none relative -mx-2 -my-1 inline-block select-none px-2 py-1',
        )}
      >
        <Fragment>{props.children}</Fragment>
        {classified && (
          <span className="pointer-events-none absolute inset-0 z-50 h-full w-full select-none bg-zinc-950" />
        )}
      </span>
    </>
  )
}
