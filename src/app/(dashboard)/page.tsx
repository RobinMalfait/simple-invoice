import { Dashboard } from './dashboard'

import { me, invoices as rawInvoices } from '~/data'
import { squashEntities } from '~/domain/squash-entities'

export default function Page() {
  let invoices = squashEntities(rawInvoices).sort((a, z) => z.number.localeCompare(a.number))
  return <Dashboard me={me} invoices={invoices} />
}
