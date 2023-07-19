import {
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { classNames } from '~/ui/class-names'
import { match } from '~/utils/match'

export let statusIconMap: Record<
  InvoiceStatus,
  typeof CheckCircleIcon | typeof ClockIcon | typeof EnvelopeIcon | typeof PencilIcon
> = {
  [InvoiceStatus.Draft]: PencilIcon,
  [InvoiceStatus.Sent]: EnvelopeIcon,
  [InvoiceStatus.Paid]: CheckCircleIcon,
  [InvoiceStatus.PartialPaid]: BellAlertIcon,
  [InvoiceStatus.Overdue]: ClockIcon,
}

let statusClassMap: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]: 'bg-gray-50 text-gray-500 border-gray-300 ring-gray-400/50',
  [InvoiceStatus.Sent]: 'bg-orange-50 text-orange-500 border-orange-300 ring-orange-500/50',
  [InvoiceStatus.Paid]: 'bg-green-50 text-green-500 border-green-300 ring-emerald-500/50',
  [InvoiceStatus.PartialPaid]: 'bg-green-50 text-green-500 border-green-300 ring-emerald-500/50',
  [InvoiceStatus.Overdue]: 'bg-red-50 text-red-500 border-red-300 ring-red-500/50',
}

export type Variant = 'badge' | 'tiny-badge'

export function StatusDisplay({
  status,
  variant = 'badge',
}: {
  status: InvoiceStatus
  variant?: Variant
}) {
  let Icon = statusIconMap[status]

  return match(variant, {
    badge() {
      return (
        <span
          className={classNames(
            'inline-flex items-center space-x-1.5 rounded-full px-2.5 py-1 font-medium capitalize ring',
            statusClassMap[status],
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="pr-1">{status}</span>
        </span>
      )
    },
    'tiny-badge'() {
      return (
        <span
          className={classNames(
            'inline-flex items-center space-x-1.5 rounded-full px-1.5 py-1 text-sm font-medium capitalize ring-1',
            statusClassMap[status],
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="pr-1">{status}</span>
        </span>
      )
    },
  })
}
