'use client'

import { Account } from '~/domain/account/account'
import { ActivityFeed } from '~/ui/activity-feed'
import { Card, CardBody, CardTitle } from '~/ui/card'
import { useEventsForAccount } from '~/ui/hooks/use-events-by'

export function AccountActivityFeed({ account }: { account: Account }) {
  let events = useEventsForAccount(account)

  if (events.length <= 0) {
    return null
  }

  return (
    <>
      {events.length > 0 && (
        <Card>
          <CardTitle>Activity feed ({events.length})</CardTitle>
          <CardBody variant="filled-vertical">
            <div className="max-h-96 overflow-auto">
              <ActivityFeed events={events} viewContext="account" />
            </div>
          </CardBody>
        </Card>
      )}
    </>
  )
}
