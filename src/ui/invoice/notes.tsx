'use client'

import { compareAsc, format, formatDistance } from 'date-fns'
import { Fragment } from 'react'
import type { Record } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { useCurrentDate } from '~/ui/hooks/use-current-date'
import { useRecord } from '~/ui/hooks/use-record'
import { useRecordStacks } from '~/ui/hooks/use-record-stacks'
import { Markdown } from '~/ui/markdown'
import { match } from '~/utils/match'

export function Notes(props: React.PropsWithChildren<{ records: Record[] }>) {
  let stacks = useRecordStacks()
  let record = useRecord()
  let records = (stacks[record.id] ?? []).map((id) => {
    return props.records.find((e) => {
      return e.id === id
    })!
  })

  let now = useCurrentDate()
  let activeRecordIdx = stacks[record.id]?.indexOf(record.id) ?? -1

  return (
    <ul role="list" className="flex flex-col gap-4">
      {records.map((record, idx) => {
        return (
          <Fragment key={record.id}>
            {records.length !== 1 && (
              <li
                className={classNames(
                  'relative flex items-center text-sm',
                  idx > activeRecordIdx && 'opacity-50 grayscale',
                )}
              >
                <span className="whitespace-nowrap pr-3">
                  {match(record.type, {
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
                  })}{' '}
                  (#{record.number})
                </span>
                <span className="h-px w-full bg-gray-200 dark:bg-zinc-600"></span>
              </li>
            )}
            <ul
              role="list"
              className={classNames(
                'relative flex flex-col gap-6',
                idx > activeRecordIdx && 'opacity-50 grayscale',
              )}
            >
              {record.internal.notes
                .slice()
                .sort((a, z) => {
                  return compareAsc(a.at, z.at)
                })
                .map((note, idx) => {
                  return (
                    <li key={idx} className="flex flex-col border-l-2 pl-2 dark:border-gray-200/25">
                      <time
                        title={format(note.at, 'PPPpp')}
                        dateTime={format(note.at, 'PPPpp')}
                        className="py-0.5 text-xs leading-5 text-gray-500 dark:text-gray-300"
                      >
                        {formatDistance(note.at, now, { addSuffix: true })}
                      </time>
                      <Markdown className="prose prose-sm dark:prose-invert">{note.value}</Markdown>
                    </li>
                  )
                })}
            </ul>
          </Fragment>
        )
      })}
    </ul>
  )
}
