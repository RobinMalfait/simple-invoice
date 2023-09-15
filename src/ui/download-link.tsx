'use client'

import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useDisposables } from '~/ui/hooks/use-disposables'

export function DownloadLink({
  children,
  ...props
}: { children: React.ReactNode } & React.ComponentPropsWithoutRef<'a'>) {
  let [downloading, setDownloading] = useState(false)
  let d = useDisposables()

  useEffect(() => {
    if (!downloading) return

    function done() {
      setDownloading(false)
      d.dispose()
    }

    // When the window is blurred, we assume the download has started. (This does happen in Chrome,
    // but not in Safari)
    d.addEventListener(window, 'blur', done)

    // Fallback in case the window doesn't blur
    d.setTimeout(() => done, 5000)

    return d.dispose
  }, [d, downloading])

  return (
    <a
      onClick={(e) => {
        if (downloading) {
          e.preventDefault()
          return
        }

        setDownloading(true)
      }}
      aria-disabled={downloading}
      download
      {...props}
    >
      {downloading ? (
        <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
      )}
      {children}
    </a>
  )
}
