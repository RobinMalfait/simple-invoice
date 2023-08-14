'use client'

import { useCallback, useMemo, useState } from 'react'
import { useIsomorphicEffect } from '~/ui/hooks/use-isomorphic-effect'
import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'

interface Props extends React.ComponentProps<'div'> {
  enabled: boolean
  onDone: () => void
  onResize: () => void
}

function FitContent({ enabled, children, onResize, onDone, ...props }: Props) {
  return (
    <div
      ref={(element) => {
        if (!element) return
        if (!enabled) return

        let { clientHeight, scrollHeight } = element.parentElement!

        if (scrollHeight > clientHeight) {
          onResize()
        } else {
          onDone()
        }
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function useFittedPagination<T>(list: T[]) {
  let [pages, setPages] = useState([list.length])
  let [workingPage, setWorkingPage] = useState(0)

  useIsomorphicEffect(() => {
    // Reset the per-page, and let it re-calculate when the `list` changes.
    setPages([list.length])
    setWorkingPage(0)
  }, [list])

  return [
    // Pages
    (() => {
      let clone = list.slice()
      return pages.map((amount, idx) => {
        return [
          // Items on page
          clone.splice(0, amount),

          // Are we done with this page or not
          idx < workingPage,
        ] as const
      })
    })(),

    // Scoped FitContent component
    useMemo(() => {
      return function ScopedFitContent({ children, ...rest }: React.ComponentProps<'div'>) {
        let { current } = usePaginationInfo()

        let handleDone = useCallback(() => {
          setWorkingPage((page) => page + 1)
        }, [])

        let handleResize = useCallback(() => {
          function update(perPage: number[]) {
            let clone = perPage.slice()

            clone[current] -= 1 // Subtract 1 from current page
            clone[current + 1] ??= 0 // Create page if it doesn't exist
            clone[current + 1] += 1 // Add 1 to next page

            return clone
          }

          // Don't worry about it...
          // This is fine...
          try {
            setPages(update)
          } catch (err) {
            requestAnimationFrame(() => setPages(update))
          }
        }, [current])

        return (
          <FitContent
            {...rest}
            enabled={workingPage === current}
            onDone={handleDone}
            onResize={handleResize}
          >
            {children}
          </FitContent>
        )
      }
    }, [workingPage]),
  ] as const
}
