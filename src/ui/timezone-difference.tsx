'use client'

import { addHours, differenceInHours, format } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

import { useCurrentDate } from '~/ui/hooks/use-current-date'

export function TimezoneDifference({
  myTimezone,
  otherTimezone,
}: {
  myTimezone: string
  otherTimezone: string
}) {
  let nowInMyTimezone = useCurrentDate()

  if (myTimezone === otherTimezone) return null

  let nowInUtc = zonedTimeToUtc(nowInMyTimezone, myTimezone)
  let nowInOtherTimezone = utcToZonedTime(nowInUtc, otherTimezone)
  let diff = differenceInHours(nowInOtherTimezone, nowInMyTimezone)

  if (diff === 0) return null

  return (
    <span className="inline-flex space-x-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 ring-2 ring-white dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
      <span>
        {diff > 0 ? '+' : ''}
        {diff}h
      </span>
      <span className="text-gray-400 dark:text-zinc-800">|</span>
      <span>{format(addHours(nowInMyTimezone, diff), 'p')}</span>
    </span>
  )
}
