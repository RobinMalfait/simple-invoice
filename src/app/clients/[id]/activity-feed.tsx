'use client'

import { Client } from '~/domain/client/client'
import { ActivityFeed } from '~/ui/activity-feed'
import { Card, CardBody, CardTitle } from '~/ui/card'
import { useEventsForClient } from '~/ui/hooks/use-events-by'

export function ClientActivityFeed({ client }: { client: Client }) {
  let events = useEventsForClient(client)

  if (events.length <= 0) {
    return null
  }

  return (
    <Card>
      <CardTitle>Activity feed ({events.length})</CardTitle>
      <CardBody variant="filled-vertical">
        <div className="max-h-96 overflow-auto">
          <ActivityFeed events={events} viewContext="client" />
        </div>
      </CardBody>
    </Card>
  )
}
