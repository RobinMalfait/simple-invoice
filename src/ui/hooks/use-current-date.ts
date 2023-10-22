import { useEffect, useState } from 'react'
import { match } from '~/utils/match'

interface Options {
  precision: 'second' | 'minute' | 'hour' | 'day'
}

export function useCurrentDate({ precision = 'minute' }: Partial<Options> = {}) {
  let [now, setNow] = useState(() => {
    return new Date()
  })

  useEffect(() => {
    let remaining =
      match(precision, {
        second: () => {
          return 1
        },
        minute: () => {
          return 60 - now.getSeconds()
        },
        hour: () => {
          return 3600 - now.getSeconds() - now.getMinutes() * 60
        },
        day: () => {
          return 86400 - now.getSeconds() - now.getMinutes() * 60 - now.getHours() * 60 * 60
        },
      }) - 1

    let timer = setTimeout(() => {
      return setNow(new Date())
    }, remaining * 1000)
    return () => {
      return clearTimeout(timer)
    }
  }, [now, precision])

  return now
}
