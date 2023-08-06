import {
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PencilIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { classNames } from '~/ui/class-names'

let statusIconMap: Record<
  QuoteStatus,
  | typeof PencilIcon
  | typeof EnvelopeIcon
  | typeof CheckCircleIcon
  | typeof XCircleIcon
  | typeof ClockIcon
  | typeof LockClosedIcon
> = {
  [QuoteStatus.Draft]: PencilIcon,
  [QuoteStatus.Sent]: EnvelopeIcon,
  [QuoteStatus.Accepted]: CheckCircleIcon,
  [QuoteStatus.Rejected]: XCircleIcon,
  [QuoteStatus.Expired]: ClockIcon,
  [QuoteStatus.Closed]: LockClosedIcon,
}

let statusClassMap: Record<QuoteStatus, string> = {
  [QuoteStatus.Draft]:
    'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
  [QuoteStatus.Sent]:
    'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20',
  [QuoteStatus.Accepted]:
    'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
  [QuoteStatus.Rejected]:
    'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20',
  [QuoteStatus.Expired]:
    'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20',
  [QuoteStatus.Closed]:
    'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
}

export function StatusDisplay({ status }: { status: QuoteStatus }) {
  let Icon = statusIconMap[status]

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset',
        statusClassMap[status],
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="pr-1">{status}</span>
    </span>
  )
}
