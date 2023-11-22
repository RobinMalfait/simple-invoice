import { CubeIcon } from '@heroicons/react/24/outline'
import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'
import { useRecord } from '~/ui/hooks/use-record'
import { useTranslation } from '~/ui/hooks/use-translation'
import { match } from '~/utils/match'

export function SmallHeading() {
  let { total, current } = usePaginationInfo()
  let record = useRecord()
  let t = useTranslation()

  return (
    <div className="bg-gray-50 px-12 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CubeIcon className="h-10 text-gray-400" />

          <span className="space-x-3 text-lg">
            <span>
              <span className="font-medium text-gray-500">
                {t((x) => {
                  return match(record.type, {
                    quote: () => {
                      return x.quote.title
                    },
                    invoice: () => {
                      return x.invoice.title
                    },
                    'credit-note': () => {
                      return x['credit-note'].title
                    },
                    receipt: () => {
                      return x.receipt.title
                    },
                  })
                })}
              </span>
              <span className="text-gray-300">.</span>
            </span>
            <span className="text-sm text-gray-300">/</span>
            <span className="text-sm tabular-nums text-gray-500">{record.number}</span>
          </span>
        </div>

        <span className="text-sm text-gray-600">
          {t(
            (x) => {
              return x.pagination.summary
            },
            {
              current: current + 1,
              total,
            },
          )}
        </span>
      </div>
    </div>
  )
}
