'use client'

import { Supplier } from '~/domain/supplier/supplier'
import { ActivityFeed } from '~/ui/activity-feed'
import { Card, CardBody, CardTitle } from '~/ui/card'
import { useEventsForSupplier } from '~/ui/hooks/use-events-by'

export function SupplierActivityFeed({ supplier }: { supplier: Supplier }) {
  let events = useEventsForSupplier(supplier)

  if (events.length <= 0) {
    return null
  }

  return (
    <Card>
      <CardTitle>Activity feed ({events.length})</CardTitle>
      <CardBody variant="filled-vertical">
        <div className="max-h-96 overflow-auto">
          <ActivityFeed events={events} viewContext="supplier" />
        </div>
      </CardBody>
    </Card>
  )
}
