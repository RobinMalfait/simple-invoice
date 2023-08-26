import { useEffect } from 'react'

export function useWindowEvent<K extends keyof WindowEventMap>(
  event: K,
  handler: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
) {
  useEffect(() => {
    window.addEventListener(event, handler, options)
    return () => window.removeEventListener(event, handler, options)
  }, [event, handler, options])
}
