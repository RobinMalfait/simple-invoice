'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useIsomorphicEffect } from '~/ui/hooks/use-isomorphic-effect'
import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'

interface Props extends React.ComponentProps<'div'> {
  enabled: boolean
  onDone: () => void
  onResize: () => void
}

let pendingFitContent = new Set()

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

function defaultPaginater<T>(list: T[], pages: number[]): T[][] {
  let clone = list.slice()
  return pages.map((amount) => clone.splice(0, amount))
}

export function useFittedPagination<T>(list: T[], paginateList = defaultPaginater) {
  let id = useId()
  let [pages, setPages] = useState([list.length])
  let [workingPage, setWorkingPage] = useState(0)

  useIsomorphicEffect(() => {
    // Reset the per-page, and let it re-calculate when the `list` changes.
    setPages([list.length])
    setWorkingPage(0)
  }, [list])

  // Completed all pages
  let done = workingPage === pages.length

  // Register the current unit of work
  useEffect(() => {
    pendingFitContent.add(id)
    return () => {
      pendingFitContent.delete(id)
      delete document.documentElement.dataset.pdfState
    }
  }, [id])

  // Complete unit of work
  let debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!done) return

    pendingFitContent.delete(id)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (pendingFitContent.size === 0) {
        document.documentElement.dataset.pdfState = 'ready'
      }
    }, 100)
  }, [id, done])

  return [
    // Pages
    (() => {
      return paginateList(list, pages).map(
        (items, idx) =>
          [
            // Items on page
            items,

            // Are we done with this page or not
            idx < workingPage,
          ] as const,
      )
    })(),

    // Scoped FitContent component
    useMemo(() => {
      return function ScopedFitContent({ children, ...rest }: React.ComponentProps<'div'>) {
        let { current } = usePaginationInfo()

        let handleDone = useCallback(() => {
          // Don't worry about it...
          // This is fine...
          try {
            setWorkingPage((page) => page + 1)
          } catch (err) {
            requestAnimationFrame(() => setWorkingPage((page) => page + 1))
          }
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
