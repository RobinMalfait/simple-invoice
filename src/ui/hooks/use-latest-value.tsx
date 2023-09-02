import { useRef } from 'react'
import { useIsomorphicEffect } from '~/ui/hooks/use-isomorphic-effect'

export function useLatestValue<T>(value: T) {
  let cache = useRef(value)

  useIsomorphicEffect(() => {
    cache.current = value
  }, [value])

  return cache
}
