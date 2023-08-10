import { useEffect, useState } from 'react'
import { match } from '~/utils/match'

interface Options {
  precision: 'second' | 'minute' | 'hour' | 'day'
}

export function useCurrentDate({ precision = 'minute' }: Partial<Options> = {}) {
  let [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let remaining =
      match(precision, {
        second: () => 1,
        minute: () => 60 - now.getSeconds(),
        hour: () => 3600 - now.getSeconds() - now.getMinutes() * 60,
        day: () => 86400 - now.getSeconds() - now.getMinutes() * 60 - now.getHours() * 60 * 60,
      }) - 1

    let timer = setTimeout(() => setNow(new Date()), remaining * 1000)
    return () => clearTimeout(timer)
  }, [now, precision])

  return now
}
