import Link from 'next/link'
import { redirect } from 'next/navigation'
import { clients, records } from '~/data'
import { isQuote } from '~/domain/record/filters'
import { combineRecords } from '~/domain/record/record'
import { Avatar } from '~/ui/avatar'
import { Classified } from '~/ui/classified'

export default async function Page() {
  if (clients.length === 0) {
    return redirect('/')
  }

  let combined = combineRecords(records)
  let recordCountByClientId = combined.reduce(
    (acc, record) => {
      if (isQuote(record)) return acc
      acc[record.client.id] = (acc[record.client.id] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="relative px-4 py-8 text-white sm:px-6 lg:px-8">
      <ul
        role="list"
        className="grid grid-cols-1 gap-4 lg:grid-cols-[repeat(auto-fill,minmax(theme(spacing.96),1fr))]"
      >
        {clients.map((client) => {
          return (
            <li
              key={client.id}
              className="relative flex flex-col gap-2 rounded-md bg-white p-4 shadow ring-1 ring-black/5 group-data-[grouped]:shadow-none group-data-[grouped]:ring-0 dark:bg-zinc-900"
            >
              <Link href={`/clients/${client.id}`} className="absolute inset-0 z-10" />
              <div className="flex items-center gap-4 text-gray-600 dark:text-zinc-400">
                <Avatar url={client.imageUrl} name={client.nickname} />
                <div className="flex flex-1 flex-col">
                  <span className="truncate">{client.nickname}</span>
                  <span className="text-xs">
                    <Classified>{client.email}</Classified>
                  </span>
                </div>
                <div className="grid aspect-square h-full place-content-center rounded border p-2 dark:border-zinc-800">
                  {recordCountByClientId[client.id]}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
