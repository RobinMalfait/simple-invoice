'use client'

import { PaperClipIcon } from '@heroicons/react/24/outline'
import { useRecord } from '~/ui/hooks/use-record'

export function AttachmentList() {
  let record = useRecord()

  return (
    <>
      <ul role="list" className="space-y-1">
        {record.attachments.map((document) => {
          return (
            <li key={document.id} className="relative flex gap-x-4">
              <button
                onClick={() => {
                  window.document
                    .querySelector(`#attachment-${document.id}`)
                    ?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="absolute inset-0 h-full w-full"
              />
              <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white dark:bg-zinc-900">
                <PaperClipIcon
                  className="h-4 w-4 text-gray-600 dark:text-gray-300"
                  aria-hidden="true"
                />
              </div>

              <p className="flex-auto py-0.5 text-xs leading-5 text-gray-600 dark:text-gray-300">
                {document.name}
              </p>
            </li>
          )
        })}
      </ul>
    </>
  )
}
