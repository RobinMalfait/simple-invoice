import { SquaresPlusIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { match } from '~/utils/match'
import { classNames } from './class-names'

export function Empty({
  message,
  footer,
  variant = 'standalone',
}: {
  message: string
  footer?: ReactNode
  variant?: 'standalone' | 'filled'
}) {
  return (
    <div
      className={classNames(
        'flex flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-900',
        match(variant, {
          standalone: 'rounded-lg shadow',
          filled: '',
        }),
      )}
    >
      <div className="my-12 flex flex-1 flex-col px-4 py-5 sm:p-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-500">
          <SquaresPlusIcon className="h-8 w-8 text-gray-400" />
          <span>{message}</span>
        </div>
      </div>
      {Boolean(footer) && <div className="bg-gray-50 px-4 py-4 sm:px-6">{footer}</div>}
    </div>
  )
}
