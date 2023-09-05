'use client'

import { Fragment } from 'react'
import type { Record } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { useRecord } from '~/ui/hooks/use-record'
import { useRecordStacks } from '~/ui/hooks/use-record-stacks'
import { match } from '~/utils/match'
import { ActivityItem } from '../activity-feed'

export function ActivityFeed(props: React.PropsWithChildren<{ records: Record[] }>) {
  let stacks = useRecordStacks()
  let record = useRecord()
  let records = (stacks[record.id] ?? []).map((id) => props.records.find((e) => e.id === id)!)

  let activeRecordIdx = stacks[record.id]?.indexOf(record.id) ?? -1

  return (
    <>
      <ul role="list" className="space-y-6">
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
                      quote: () => 'Quote',
                      invoice: () => 'Invoice',
                      receipt: () => 'Receipt',
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
                  records.length !== 1 && 'mt-6',
                )}
              >
                {record.events.map((activityItem, activityItemIdx, all) => (
                  <ActivityItem
                    key={activityItem.id}
                    previous={all[activityItemIdx - 1]}
                    item={activityItem}
                    isLast={activityItemIdx === record.events.length - 1}
                  />
                ))}
              </ul>
            </Fragment>
          )
        })}
      </ul>
    </>
  )
}
