'use client'

import { useEffect, useId, useMemo, useReducer, useRef } from 'react'
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
  return pages.map((amount) => {
    return clone.splice(0, amount)
  })
}

type PaginationState = {
  list: unknown[]
  workingPage: number
  pages: number[]
  between: [number, number]
}

type Action = { type: 'good' } | { type: 'bad' } | { type: 'reset'; list: unknown[] }

function paginationReducer(state: PaginationState, action: Action): PaginationState {
  switch (action.type) {
    case 'reset': {
      return {
        ...state,
        list: action.list,
        workingPage: 0,
        pages: [action.list.length],
        between: [0, action.list.length],
      }
    }

    case 'good': {
      let remaining =
        state.list.length -
        state.pages.slice(0, state.workingPage + 1).reduce((a, b) => {
          return a + b
        }, 0)

      // If we've handled all the pages, then we're done
      if (remaining === 0) {
        return { ...state, workingPage: state.workingPage + 1 }
      }

      let [min, max] = state.between

      // We are stuck on a number, let's try the larger one first because if that one fits, its
      // better to fill the page with the larger number.
      if (max - min === 1) {
        // Try the larger number first
        return {
          ...state,
          pages: state.pages.with(state.workingPage, max),
          between: [max, max],
        }
      }

      if (min === max) {
        // Prepare the next page
        return {
          ...state,
          pages: state.pages.with(state.workingPage + 1, remaining),
          workingPage: state.workingPage + 1,
          between: [0, remaining],
        }
      }

      let newPages = state.pages.with(state.workingPage, Math.ceil((min + max) / 2))
      // Move the remaining to the next page
      newPages[state.workingPage + 1] ??= Math.max(
        0,
        state.list.length -
          state.pages.slice(0, state.workingPage + 1).reduce((a, b) => {
            return a + b
          }, 0),
      )

      // We didn't settle on a number yet, let's keep going
      return {
        ...state,
        pages: newPages,
        between: [state.pages[state.workingPage], max],
      }
    }

    case 'bad': {
      let [min, max] = state.between

      // We tried the larger number first, and it didn't fit, so we know that the smaller number
      // is the one that fits.
      if (min === max) {
        return {
          ...state,
          pages: state.pages.with(state.workingPage, min - 1),
          between: [min - 1, min - 1],
        }
      }

      let newPages = state.pages.with(state.workingPage, Math.floor((min + max) / 2))

      // Move the remaining to the next page
      newPages[state.workingPage + 1] ??= Math.max(
        0,
        state.list.length -
          state.pages.slice(0, state.workingPage + 1).reduce((a, b) => {
            return a + b
          }, 0),
      )

      // When it's "bad", we know it doesn't fit, which means that we should always move to the
      // left.
      return {
        ...state,
        pages: newPages,
        between: [min, state.pages[state.workingPage]],
      }
    }

    default: {
      return state
    }
  }
}

export function useFittedPagination<T>(list: T[], paginateList = defaultPaginater) {
  let id = useId()
  let [state, dispatch] = useReducer(paginationReducer, {
    list,
    workingPage: 0,
    pages: [list.length],
    between: [0, list.length],
  })

  useEffect(() => {
    // Bail if the list hasn't changed
    if (list === state.list) return

    // Reset the per-page, and let it re-calculate when the `list` changes.
    dispatch({ type: 'reset', list })
  }, [list, state.list])

  // Completed all pages
  let done = state.workingPage === state.pages.length

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
      return paginateList(list, state.pages).map((items, idx) => {
        return [
          // Items on page
          items,

          // Are we done with this page or not
          idx < state.workingPage,
        ] as const
      })
    })(),

    // Scoped FitContent component
    useMemo(() => {
      return function ScopedFitContent({ children, ...rest }: React.ComponentProps<'div'>) {
        let { current } = usePaginationInfo()

        return (
          <FitContent
            {...rest}
            enabled={state.workingPage === current}
            onDone={() => {
              queueMicrotask(() => {
                return dispatch({ type: 'good' })
              })
            }}
            onResize={() => {
              queueMicrotask(() => {
                return dispatch({ type: 'bad' })
              })
            }}
          >
            {children}
          </FitContent>
        )
      }
    }, [state.workingPage]),

    // Done
    done,
  ] as const
}
