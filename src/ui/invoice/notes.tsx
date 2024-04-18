'use client'

import { format, formatDistance } from 'date-fns'
import { useCurrentDate } from '~/ui/hooks/use-current-date'
import { Markdown } from '../markdown'

export function Notes({ notes }: { notes: { value: string; at: Date }[] }) {
  let now = useCurrentDate()

  return (
    <ul role="list" className="flex flex-col gap-4">
      {notes.map((note, idx) => {
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
  )
}
