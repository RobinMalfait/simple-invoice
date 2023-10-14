'use client'

import { offset, useFloating } from '@floating-ui/react'
import { Portal } from '@headlessui/react'
import { CalendarIcon } from '@heroicons/react/24/outline'
import {
  addDays,
  addMonths,
  addQuarters,
  addYears,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
} from 'date-fns'
import { FormatRange } from '~/ui/date-range'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '~/ui/headlessui'

type Preset = [
  string,
  (now: Date, offsetMultiplier: number) => [Date | undefined, Date | undefined],
]

export let options: Preset[] = [
  ['Today', (now, n = 1) => [startOfDay(addDays(now, 1 * n)), endOfDay(addDays(now, 1 * n))]],
  [
    'Yesterday',
    (now, n) => [
      subDays(startOfDay(addDays(now, 1 * n)), 1),
      subDays(endOfDay(addDays(now, 1 * n)), 1),
    ],
  ],
  [
    'Last 7 days',
    (now, n) => [subDays(startOfDay(addDays(now, 7 * n)), 7), endOfDay(addDays(now, 7 * n))],
  ],
  [
    'Last 30 days',
    (now, n) => [subDays(startOfDay(addDays(now, 30 * n)), 30), endOfDay(addDays(now, 30 * n))],
  ],
  [
    'This month',
    (now, n) => [
      startOfMonth(startOfDay(addMonths(now, 1 * n))),
      endOfMonth(endOfDay(addMonths(now, 1 * n))),
    ],
  ],
  [
    'Quarter to date',
    (now, n) => [startOfQuarter(addQuarters(now, 1 * n)), addQuarters(now, 1 * n)],
  ],
  [
    'This quarter',
    (now, n) => [startOfQuarter(addQuarters(now, 1 * n)), endOfQuarter(addQuarters(now, 1 * n))],
  ],
  ['Year to date', (now, n) => [startOfYear(addYears(now, 1 * n)), addYears(now, 1 * n)]],
  ['This year', (now, n) => [startOfYear(addYears(now, 1 * n)), endOfYear(addYears(now, 1 * n))]],
  ['All', (_now) => [undefined, undefined]],
]

export function RangePicker({
  start,
  end,
  value,
  onChange,
}: {
  start: Date | null
  end: Date | null
  value: string
  onChange(preset: string): void
}) {
  let { refs, floatingStyles } = useFloating({
    placement: 'bottom-end',
    middleware: [offset(10)],
  })

  return (
    <Listbox as="div" className="relative isolate" value={value} onChange={onChange}>
      <ListboxButton
        ref={refs.setReference}
        className="rounded-md bg-white px-2 py-1.5 shadow ring-1 ring-black/10 dark:bg-zinc-900/75"
      >
        <div className="flex items-center gap-1 text-sm dark:text-zinc-300">
          <CalendarIcon className="h-4 w-4" />
          <FormatRange start={start} end={end} />
        </div>
      </ListboxButton>
      <Portal>
        <ListboxOptions
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 w-64 rounded-md bg-white/75 py-2 shadow ring-1 ring-black/10 backdrop-blur focus:outline-none dark:bg-zinc-950/75"
        >
          <span className="px-4 text-xs font-semibold dark:text-zinc-400">Presets</span>
          <div className="flex w-full flex-col px-2">
            {options.map(([label]) => (
              <ListboxOption
                key={label}
                as="button"
                value={label}
                className="relative w-full rounded-lg px-2 py-2 text-left text-sm ui-active:bg-gray-100 ui-not-active:bg-transparent dark:text-zinc-400 dark:ui-active:bg-white/10"
              >
                {label}
              </ListboxOption>
            ))}
          </div>
        </ListboxOptions>
      </Portal>
    </Listbox>
  )
}
