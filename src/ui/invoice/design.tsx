'use client'

import {
  Attachment as AttachmentPages,
  Invoice as RecordPages,
} from '~/ui/invoice/designs/basic/invoice'

import { AttachmentProvider } from '~/ui/hooks/use-attachment'
import { RecordProvider, useRecord } from '~/ui/hooks/use-record'

export function Invoice() {
  let record = useRecord()

  return (
    <RecordProvider record={record}>
      <div className="flex w-full flex-wrap gap-8 font-pdf print:gap-0">
        <RecordPages />

        {record.attachments.map((attachment) => {
          return (
            <AttachmentProvider key={attachment.id} document={attachment}>
              <AttachmentPages />
            </AttachmentProvider>
          )
        })}
      </div>
    </RecordProvider>
  )
}
