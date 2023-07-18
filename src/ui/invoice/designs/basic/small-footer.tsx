import { useInvoice } from '~/ui/hooks/use-invoice'
import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'

export function SmallFooter() {
  let { total, current } = usePaginationInfo()
  let invoice = useInvoice()

  return (
    <div className="flex items-center justify-between bg-gray-50 px-12 py-3 text-sm text-gray-600">
      <span>{invoice.account.name}</span>
      <span>
        {current + 1} of {total}
      </span>
    </div>
  )
}
