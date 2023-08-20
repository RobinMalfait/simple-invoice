import { Dashboard } from './dashboard'

import { compareDesc } from 'date-fns'
import { me, records as rawRecords } from '~/data'
import { resolveRelevantRecordDate, squashRecords } from '~/domain/record/record'

export default function Page() {
  let records = squashRecords(rawRecords).sort(
    (a, z) =>
      compareDesc(resolveRelevantRecordDate(a), resolveRelevantRecordDate(z)) ||
      z.number.localeCompare(a.number),
  )

  return <Dashboard me={me} records={records} />
}
