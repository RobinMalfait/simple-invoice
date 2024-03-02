import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { title } from 'case'
import { TransactionStatus } from '~/domain/transaction/transaction-status'
import { classNames } from '~/ui/class-names'

let statusIconMap: Record<TransactionStatus, typeof CheckCircleIcon | typeof ClockIcon> = {
  [TransactionStatus.Pending]: ClockIcon,
  [TransactionStatus.Completed]: CheckCircleIcon,
}

let statusClassMap: Record<TransactionStatus, string> = {
  [TransactionStatus.Completed]:
    'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
  [TransactionStatus.Pending]:
    'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20',
}

export function StatusDisplay({
  status,
  mini = false,
  children,
}: {
  status: TransactionStatus
  mini?: boolean
  children?: React.ReactNode
}) {
  let Icon = statusIconMap[status]

  return (
    <span
      title={title(status)}
      className={classNames(
        'inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset',
        statusClassMap[status],
      )}
    >
      <Icon className="h-4 w-4" />
      {!mini && <span className="pr-1">{children || title(status)}</span>}
    </span>
  )
}
