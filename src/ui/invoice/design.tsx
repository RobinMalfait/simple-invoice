'use client'

import { AttachmentProvider } from '~/ui/hooks/use-attachment'
import { RecordProvider, useRecord } from '~/ui/hooks/use-record'
import { env } from '~/utils/env'

let { Attachment: AttachmentPages, Invoice: RecordPages } = require(
  `~/ui/invoice/designs/${process.env.NEXT_PUBLIC_DESIGN_SOURCE_FILE ?? process.env.NEXT_PUBLIC_ENVIRONMENT ?? env.DATA_SOURCE_FILE}/invoice.tsx`,
)

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
