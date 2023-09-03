import Link from 'next/link'
import { me } from '~/data'
import { Avatar } from '~/ui/avatar'
import { Classified } from '~/ui/classified'

export default async function Page() {
  return (
    <div className="relative px-4 py-8 text-white sm:px-6 lg:px-8">
      <ul
        role="list"
        className="grid grid-cols-1 gap-4 lg:grid-cols-[repeat(auto-fill,minmax(theme(spacing.96),1fr))]"
      >
        {[me].map((account) => (
          <li
            key={account.id}
            className="relative flex flex-col gap-2 rounded-md bg-white p-4 shadow ring-1 ring-black/5 group-data-[grouped]:shadow-none group-data-[grouped]:ring-0 dark:bg-zinc-900"
          >
            <Link href={`/accounts/${account.id}`} className="absolute inset-0 z-10" />
            <div className="flex items-center gap-4 text-gray-600 dark:text-zinc-400">
              <Avatar url={account.imageUrl} name={account.name} />
              <div className="flex flex-1 flex-col">
                <span className="truncate">{account.name}</span>
                <span className="text-xs">
                  <Classified>{account.email}</Classified>
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
