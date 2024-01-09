import { useMemo } from 'react'
import { useRecord } from '~/ui/hooks/use-record'

export function useRecordInfo() {
  let record = useRecord()

  return useMemo(() => {
    return {
      get hasVat() {
        return record.items.some((item) => {
          return item.taxRate !== null
        })
      },
    }
  }, [record])
}
