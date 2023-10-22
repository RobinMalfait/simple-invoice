import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIsomorphicEffect } from '~/ui/hooks/use-isomorphic-effect'
import { useWindowEvent } from '~/ui/hooks/use-window-event'

export function useClientRect(container: React.RefObject<HTMLElement>) {
  let [data, setData] = useState<{
    width?: number
    height?: number
    left?: number
    top?: number
  }>({})

  let setCalculatedStyles = useCallback(
    (element: HTMLElement | null) => {
      if (!element) {
        return
      }

      let { width, height, top, left } = element.getBoundingClientRect()
      if (
        data.width !== width ||
        data.height !== height ||
        data.top !== top ||
        data.left !== left
      ) {
        setData({ width, height, left, top })
      }
    },
    [data.height, data.left, data.top, data.width],
  )

  useIsomorphicEffect(() => {
    setCalculatedStyles(container.current)
  }, [container, setCalculatedStyles])

  useEffect(() => {
    let element = container.current
    if (!element) {
      return
    }

    // @ts-ignore
    let resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === element) {
          setCalculatedStyles(element)
        }
      }
    })

    resizeObserver.observe(element)
    return () => {
      return resizeObserver.unobserve(element!)
    }
  })

  useWindowEvent('resize', () => {
    setCalculatedStyles(container.current)
  })

  useWindowEvent('scroll', () => {
    setCalculatedStyles(container.current)
  })

  let force = useCallback(() => {
    setCalculatedStyles(container.current)
  }, [setCalculatedStyles, container])

  return useMemo(() => {
    return { ...data, force }
  }, [data, force])
}
