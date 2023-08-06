'use client'

import { EyeIcon } from '@heroicons/react/24/outline'
import { DownloadLink } from '~/ui/download-link'
import { useInvoice } from '~/ui/hooks/use-invoice'

export function Actions() {
  let entity = useInvoice()

  return (
    <>
      <DownloadLink
        className="inline-flex items-center justify-center"
        href={`/${entity.type}/${entity.number}/pdf`}
      >
        Download PDF
      </DownloadLink>
      <a
        className="inline-flex items-center justify-center"
        target="_blank"
        href={`/${entity.type}/${entity.number}/pdf?preview`}
      >
        <EyeIcon className="mr-2 h-4 w-4" />
        <span>Preview PDF</span>
      </a>
    </>
  )
}
