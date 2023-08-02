import { CubeIcon } from '@heroicons/react/24/outline'
import { useInvoice } from '~/ui/hooks/use-invoice'
import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'
import { useTranslation } from '~/ui/hooks/use-translation'

export function SmallHeading() {
  let { total, current } = usePaginationInfo()
  let invoice = useInvoice()
  let t = useTranslation()

  return (
    <div className="bg-gray-50 px-12 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CubeIcon className="h-10 text-gray-400" />

          <span className="space-x-3 text-lg">
            <span>
              <span className="font-medium text-gray-500">{t((x) => x.invoice.title)}</span>
              <span className="text-gray-300">.</span>
            </span>
            <span className="text-sm text-gray-300">/</span>
            <span className="text-sm tabular-nums text-gray-500">{invoice.number}</span>
          </span>
        </div>

        <span className="text-sm text-gray-600">
          {t((x) => x.pagination.summary, {
            current: current + 1,
            total,
          })}
        </span>
      </div>
    </div>
  )
}
