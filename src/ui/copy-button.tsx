'use client'

import { ComponentProps, useState } from 'react'
import { match } from '~/utils/match'

export function CopyButton({
  text,
  html,
  children,
  ...props
}: ComponentProps<'button'> & {
  text?: string
  html?: string
}) {
  let [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  return (
    <button
      onClick={async () => {
        let data = [
          new ClipboardItem(
            Object.fromEntries(
              [
                text != null ? ['text/plain', new Blob([text], { type: 'text/plain' })] : null,
                html != null ? ['text/html', new Blob([html], { type: 'text/html' })] : null,
              ].filter(Boolean) as [string, Blob][],
            ),
          ),
        ]
        await navigator.clipboard.write(data)
        setCopyStatus('copied')
        setTimeout(() => setCopyStatus('idle'), 3000)
      }}
      {...props}
    >
      {match(copyStatus, {
        idle: () => <>{children}</>,
        copied: () => <>Copied!</>,
      })}
    </button>
  )
}
