import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'
import { useRecord } from '~/ui/hooks/use-record'
import { useTranslation } from '~/ui/hooks/use-translation'

export function SmallFooter() {
  let { total, current } = usePaginationInfo()
  let record = useRecord()
  let t = useTranslation()

  return (
    <div className="flex items-center justify-between bg-gray-50 px-12 py-3 text-sm text-gray-600 dark:bg-zinc-900 dark:text-zinc-300">
      <span>{record.account.name}</span>
      <span>
        {t((x) => x.pagination.summary, {
          current: current + 1,
          total,
        })}
      </span>
    </div>
  )
}
