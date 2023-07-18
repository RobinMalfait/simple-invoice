'use client'

import { ReactNode, useMemo, useState } from 'react'
import { useIsomorphicEffect } from '~/ui/hooks/use-isomorphic-effect'
import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'

interface Props {
  children: ReactNode
  onResize: () => void
}

function FitContent({ children, onResize }: Props) {
  return (
    <div
      ref={(element) => {
        if (!element) return
        let { clientHeight, scrollHeight } = element.parentElement!
        if (scrollHeight > clientHeight) onResize()
      }}
    >
      {children}
    </div>
  )
}

export function useInvoicePagination<T>(list: T[]) {
  let [perPage, setPerPage] = useState([list.length])

  useIsomorphicEffect(() => {
    // Reset the per-page, and let it re-calculate
    setPerPage([list.length])
  }, [list])

  return [
    // Pages
    perPage.map((amount, i) => {
      let offset = perPage.slice(0, i).reduce((total, amount) => total + amount, 0)
      return list.slice(offset, offset + amount)
    }),

    // Scoped FitContent component
    useMemo(() => {
      return function ScopedFitContent({ children }: { children: ReactNode }) {
        let { current } = usePaginationInfo()
        return (
          <FitContent
            onResize={() => {
              setPerPage((perPage) => {
                let clone = perPage.slice()

                clone[current] -= 1 // Subtract 1 from current page
                clone[current + 1] ??= 0 // Create page if it doesn't exist
                clone[current + 1] += 1 // Add 1 to next page

                return clone
              })
            }}
          >
            {children}
          </FitContent>
        )
      }
    }, [setPerPage]),
  ] as const
}
