import { CalendarIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { Invoice } from '~/domain/invoice/invoice'
import { total, TotalFeatures } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { StatusDisplay } from './status'

export function TinyInvoice({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex aspect-a4 w-full shrink-0 flex-col overflow-hidden rounded-md bg-gradient-to-br from-rose-50/90 to-blue-50/90 shadow">
      <div className="flex items-center justify-between bg-white/75 p-3 backdrop-blur">
        {invoice.client.name}
        <StatusDisplay variant="tiny-badge" status={invoice.state} />
      </div>

      <div className="flex flex-1 items-center justify-center border-y border-black/5">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900">{invoice.number}</h3>
          <div className="mt-1 flex flex-grow flex-col justify-between">
            <div className="text-sm text-gray-500">
              <Money amount={total(invoice.items, TotalFeatures.IncludingVAT)} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-50 p-3">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span>{format(invoice.issueDate, 'PP')}</span>
        </span>
        <span className="flex gap-1">
          <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
          <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
          <span className="block h-1 w-1 rounded-full bg-gray-300"></span>
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span>{format(invoice.dueDate, 'PP')}</span>
        </span>
      </div>
    </div>
  )
}
