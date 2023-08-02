import { useInvoice } from '~/ui/hooks/use-invoice'
import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'
import { useTranslation } from '~/ui/hooks/use-translation'

export function SmallFooter() {
  let { total, current } = usePaginationInfo()
  let invoice = useInvoice()
  let t = useTranslation()

  return (
    <div className="flex items-center justify-between bg-gray-50 px-12 py-3 text-sm text-gray-600">
      <span>{invoice.account.name}</span>
      <span>
        {t((x) => x.pagination.summary, {
          current: current + 1,
          total,
        })}
      </span>
    </div>
  )
}
