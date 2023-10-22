import { Dashboard } from './dashboard'

import { compareDesc } from 'date-fns'
import { load } from '~/app/(db)/actions'
import { me, records as rawRecords } from '~/data'
import {
  clientCountMilestonesData,
  internationalClientCountMilestonesData,
  invoiceCountMilestonesData,
  revenueMilestonesData,
} from '~/domain/milestone/milestone'
import { combineRecords, resolveRelevantRecordDate } from '~/domain/record/record'

export default async function Page() {
  let config = await load()
  let records = combineRecords(rawRecords).sort((a, z) => {
    return (
      compareDesc(resolveRelevantRecordDate(a), resolveRelevantRecordDate(z)) ||
      z.number.localeCompare(a.number)
    )
  })

  return (
    <Dashboard
      me={me}
      records={records}
      milestones={{
        clientCountMilestonesData,
        internationalClientCountMilestonesData,
        invoiceCountMilestonesData,
        revenueMilestonesData,
      }}
      dashboardConfig={config.ui.dashboard}
    />
  )
}
