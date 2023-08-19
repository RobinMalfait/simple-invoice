'use client'

import { PaperClipIcon } from '@heroicons/react/24/outline'
import { useInvoice } from '~/ui/hooks/use-invoice'

export function AttachmentList() {
  let entity = useInvoice()

  return (
    <>
      <ul role="list" className="space-y-1">
        {entity.attachments.map((document) => {
          return (
            <li key={document.id} className="relative flex gap-x-4">
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
        {entity.attachments.length === 0 && (
          <li className="text-xs leading-5 text-gray-600 dark:text-gray-300">No attachments</li>
        )}
      </ul>
    </>
  )
}
