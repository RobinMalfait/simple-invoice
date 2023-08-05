import { CalendarIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { Invoice } from '~/domain/invoice/invoice'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { StatusDisplay } from './status'

export function TinyInvoice({ invoice }: { invoice: Invoice }) {
  return (
    <div className="overflow-hidden rounded-md bg-white shadow dark:bg-zinc-950">
      <div className="flex aspect-a4 w-full shrink-0 flex-col bg-gradient-to-br from-rose-50/90 to-blue-50/90 dark:from-rose-200/90 dark:to-blue-200/90">
        <div className="flex items-center justify-between bg-gray-50 p-3 text-gray-500 dark:bg-zinc-950/75 dark:text-gray-300">
          {invoice.client.name}
          <StatusDisplay variant="tiny-badge" status={invoice.state} />
        </div>

        <div className="flex flex-1 items-center justify-center border-y border-black/5">
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-900">{invoice.number}</h3>
            <div className="mt-1 flex flex-grow flex-col justify-between">
              <div className="text-sm text-gray-500">
                <Money amount={total(invoice)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-50 p-3 dark:bg-zinc-950/75">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
            <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-white" />
            <span>{format(invoice.issueDate, 'PP')}</span>
          </span>
          <span className="flex gap-1">
            <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
            <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-white" />
            <span>{format(invoice.dueDate, 'PP')}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
