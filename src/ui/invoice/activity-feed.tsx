'use client'

import { Fragment } from 'react'
import type { Record } from '~/domain/record/record'
import { ActivityItem, ViewContext } from '~/ui/activity-feed'
import { classNames } from '~/ui/class-names'
import { useLazyEventsForRecord } from '~/ui/hooks/use-events-by'
import { useRecord } from '~/ui/hooks/use-record'
import { useRecordStacks } from '~/ui/hooks/use-record-stacks'
import { match } from '~/utils/match'

export function ActivityFeed(props: React.PropsWithChildren<{ records: Record[] }>) {
  let stacks = useRecordStacks()
  let record = useRecord()
  let records = (stacks[record.id] ?? []).map((id) => {
    return props.records.find((e) => {
      return e.id === id
    })!
  })

  let activeRecordIdx = stacks[record.id]?.indexOf(record.id) ?? -1

  let getEvents = useLazyEventsForRecord()

  return (
    <ViewContext.Provider value="record">
      <ul role="list" className="space-y-6">
        {records.map((record, idx) => {
          let events = getEvents(record)
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
                  records.length !== 1 && 'mt-6',
                )}
              >
                {events.map((activityItem, activityItemIdx, all) => {
                  let isLast = activityItemIdx === all.length - 1
                  let isLastNonMilestone = all.slice(activityItemIdx + 1).every((e) => {
                    return e.tags.includes('milestone')
                  })

                  return (
                    <ActivityItem
                      key={activityItem.id}
                      previous={all[activityItemIdx - 1]}
                      item={activityItem}
                      isFirst={activityItemIdx === 0}
                      isLast={isLast}
                      withIndicator={isLast || isLastNonMilestone}
                    />
                  )
                })}
              </ul>
            </Fragment>
          )
        })}
      </ul>
    </ViewContext.Provider>
  )
}
