import { useEffect, useLayoutEffect } from 'react'

export let useIsomorphicEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
