'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import * as React from 'react'
import type { Record } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { RecordProvider, useRecord } from '~/ui/hooks/use-record'
import { useRecordStacks } from '~/ui/hooks/use-record-stacks'
import { match } from '~/utils/match'

let HistoryContext = React.createContext<{
  options: Record[]
} | null>(null)

export function History(props: React.PropsWithChildren<{ record: Record; records: Record[] }>) {
  let stacks = useRecordStacks()
  let options = (stacks[props.record.id] ?? []).map((id) => {
    return props.records.find((e) => {
      return e.id === id
    })!
  })

  return (
    <RecordProvider record={props.record}>
      <HistoryContext.Provider value={{ options }}>{props.children}</HistoryContext.Provider>
    </RecordProvider>
  )
}

export function HistoryActions() {
  let ctx = React.useContext(HistoryContext)
  if (!ctx) throw new Error('<HistoryAction /> must be used within <History />')
  let record = useRecord()
  let { options } = ctx

  if (options.length <= 1) return null

  let previous =
    options[
      options.findIndex((option) => {
        return option.id === record.id
      }) - 1
    ]
  let next =
    options[
      options.findIndex((option) => {
        return option.id === record.id
      }) + 1
    ]

  return (
    <div className="flex w-full items-center justify-between gap-1">
      <div className="flex w-full items-center justify-start gap-[inherit]">
        <Link
          href={previous ? `/${previous.type}/${previous.number}` : '#'}
          aria-disabled={!previous}
          className="inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-950"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <Link
          href={next ? `/${next.type}/${next.number}` : '#'}
          aria-disabled={!next}
          className="inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-950"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Link>
      </div>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <MenuButton className="inline-flex w-full select-none justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-950">
            <ClockIcon
              className="-ml-1 h-5 w-5 text-gray-400 dark:text-zinc-500"
              aria-hidden="true"
            />
            History{' '}
            <span className="tabular-nums">
              (
              {options.findIndex((option) => {
                return option.id === record.id
              }) + 1}
              /{options.length})
            </span>
            <ChevronDownIcon
              className="-mr-1 h-5 w-5 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
            />
          </MenuButton>
        </div>

        <MenuItems
          transition
          anchor="bottom end"
          className="z-10 w-56 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition [--anchor-gap:theme(spacing.1)] [--anchor-offset:theme(spacing.1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in dark:bg-zinc-900 dark:ring-white/10"
        >
          <div className="py-1">
            {options.map((e) => {
              let Icon = e.id === record.id ? CheckCircleIcon : 'span'

              return (
                <MenuItem key={e.id}>
                  {({ focus }) => {
                    return (
                      <Link
                        href={`/${e.type}/${e.number}`}
                        className={classNames(
                          focus
                            ? 'bg-gray-100 text-gray-900 dark:bg-zinc-950 dark:text-gray-200'
                            : 'text-gray-700 dark:text-zinc-400',
                          'group flex w-full items-center px-4 py-2 text-sm',
                        )}
                      >
                        <Icon
                          className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                          aria-hidden="true"
                        />
                        <span className="inline-flex w-full items-center justify-between gap-2">
                          <span>
                            {match(e.type, {
                              quote: () => {
                                return 'Quote'
                              },
                              invoice: () => {
                                return 'Invoice'
                              },
                              'credit-note': () => {
                                return 'Credit note'
                              },
                              receipt: () => {
                                return 'Receipt'
                              },
                            })}
                          </span>
                          <span>#{e.number}</span>
                        </span>
                      </Link>
                    )
                  }}
                </MenuItem>
              )
            })}
          </div>
        </MenuItems>
      </Menu>
    </div>
  )
}
