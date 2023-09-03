'use client'

import { createContext, Fragment, useContext, useEffect, useRef } from 'react'
import { classNames } from '~/ui/class-names'
import { useClientRect } from '~/ui/hooks/use-client-rect'

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

  let container = useRef<HTMLDivElement | null>(null)
  let { width = 0, height = 0 } = useClientRect(container)

  return (
    <>
      <span
        ref={container}
        className={classNames(
          classified && 'pointer-events-none relative inline-block select-none',
        )}
      >
        <Fragment>{props.children}</Fragment>
        {classified && (
          <span
            style={{
              width: width + 8,
              height: height + 4,
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 z-50 h-full w-full -translate-x-1/2 -translate-y-1/2 select-none bg-zinc-950"
          />
        )}
      </span>
    </>
  )
}
