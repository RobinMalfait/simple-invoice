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
  min,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subYears,
} from 'date-fns'
import { FormatRange } from '~/ui/date-range'
import { Menu, MenuButton, MenuItem, MenuItems } from '~/ui/headlessui'

export let options: [
  string,
  (now: Date) => [Date | null, Date | null],
  (value: Date, range: [start: Date, end: Date]) => Date,
  (value: Date, range: [start: Date, end: Date]) => Date,
][] = [
  [
    'Today',
    (now) => [startOfDay(now), endOfDay(now)],
    (value) => subDays(value, 1),
    (value) => addDays(value, 1),
  ],
  [
    'Yesterday',
    (now) => [subDays(startOfDay(now), 1), subDays(endOfDay(now), 1)],
    (value) => subDays(value, 1),
    (value) => addDays(value, 1),
  ],
  [
    'Last 7 days',
    (now) => [subDays(startOfDay(now), 7), endOfDay(now)],
    (value) => subDays(value, 7),
    (value) => addDays(value, 7),
  ],
  [
    'Last 30 days',
    (now) => [subDays(startOfDay(now), 30), endOfDay(now)],
    (value) => subDays(value, 30),
    (value) => addDays(value, 30),
  ],
  [
    'This month',
    (now) => [startOfMonth(startOfDay(now)), endOfMonth(endOfDay(now))],
    (x) => subMonths(x, 1),
    (x) => addMonths(x, 1),
  ],
  [
    'Quarter to date',
    (now) => [startOfQuarter(now), now],
    (value) => subQuarters(value, 1),
    (value) => addQuarters(value, 1),
  ],
  [
    'This quarter',
    (now) => [startOfQuarter(now), endOfQuarter(now)],
    (value) => subQuarters(value, 1),
    (value) => addQuarters(value, 1),
  ],
  [
    'Year to date',
    (now) => [startOfYear(now), now],
    (value) => subYears(value, 1),
    (value) => addYears(value, 1),
  ],
  [
    'This year',
    (now) => [startOfYear(now), endOfYear(now)],
    (value) => subYears(value, 1),
    (value) => addYears(value, 1),
  ],
  [
    'All',
    (_now) => [null, null],
    (_value, range) => subDays(min(range), 1),
    (_value, range) => addDays(min(range), 1),
  ],
]

export function RangePicker({
  start,
  end,
  onChange,
}: {
  start: Date | null
  end: Date | null
  onChange(
    range: [start: Date | null, end: Date | null],
    previous: (value: Date, range: [start: Date, end: Date]) => Date,
    next: (value: Date, range: [start: Date, end: Date]) => Date,
  ): void
}) {
  let now = new Date()

  let { refs, floatingStyles } = useFloating({
    placement: 'bottom-end',
    middleware: [offset(10)],
  })

  return (
    <Menu as="div" className="relative isolate">
      <MenuButton
        ref={refs.setReference}
        className="rounded-md bg-white px-2 py-1.5 shadow ring-1 ring-black/10 dark:bg-zinc-900/75"
      >
        <div className="flex items-center gap-1 text-sm dark:text-zinc-300">
          <CalendarIcon className="h-4 w-4" />
          <FormatRange start={start} end={end} />
        </div>
      </MenuButton>
      <Portal>
        <MenuItems
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 w-64 rounded-md bg-white/75 py-2 shadow ring-1 ring-black/10 backdrop-blur focus:outline-none dark:bg-zinc-950/75"
        >
          <span className="px-4 text-xs font-semibold dark:text-zinc-400">Presets</span>
          <div className="flex w-full flex-col px-2">
            {options.map(([label, handle, previous, next]) => (
              <MenuItem
                key={label}
                as="button"
                onClick={() => onChange(handle(now), previous, next)}
                className="relative w-full rounded-lg px-2 py-2 text-left text-sm ui-active:bg-gray-100 ui-not-active:bg-transparent dark:text-zinc-400 dark:ui-active:bg-white/10"
              >
                {label}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Portal>
    </Menu>
  )
}
