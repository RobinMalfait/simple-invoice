import { Dashboard } from './dashboard'

import { compareDesc } from 'date-fns'
import { me, invoices as rawInvoices } from '~/data'
import { resolveRelevantEntityDate } from '~/domain/relevant-entity-date'
import { squashEntities } from '~/domain/squash-entities'

export default function Page() {
  let invoices = squashEntities(rawInvoices).sort(
    (a, z) =>
      compareDesc(resolveRelevantEntityDate(a), resolveRelevantEntityDate(z)) ||
      z.number.localeCompare(a.number),
  )

  return <Dashboard me={me} invoices={invoices} />
}
