import {
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { title } from 'case'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { classNames } from '~/ui/class-names'

let statusIconMap: Record<
  InvoiceStatus,
  | typeof CheckCircleIcon
  | typeof ClockIcon
  | typeof EnvelopeIcon
  | typeof PencilIcon
  | typeof LockClosedIcon
> = {
  [InvoiceStatus.Draft]: PencilIcon,
  [InvoiceStatus.Sent]: EnvelopeIcon,
  [InvoiceStatus.Paid]: CheckCircleIcon,
  [InvoiceStatus.PartiallyPaid]: BellAlertIcon,
  [InvoiceStatus.Overdue]: ClockIcon,
  [InvoiceStatus.Closed]: LockClosedIcon,
}

let statusClassMap: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]:
    'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
  [InvoiceStatus.Sent]:
    'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20',
  [InvoiceStatus.Paid]:
    'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
  [InvoiceStatus.PartiallyPaid]:
    'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20',
  [InvoiceStatus.Overdue]:
    'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20',
  [InvoiceStatus.Closed]:
    'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
}

export function StatusDisplay({ status }: { status: InvoiceStatus }) {
  let Icon = statusIconMap[status]

  return (
    <span
      className={classNames(
        'inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset',
        statusClassMap[status],
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="pr-1">{title(status)}</span>
    </span>
  )
}
