'use client'

import {
  CalculatorIcon,
  CubeIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  HomeIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Account } from '~/domain/account/account'
import { recordHasWarning } from '~/domain/record/filters'
import { Record } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { RecordStacksProvider } from '~/ui/hooks/use-record-stacks'

type Navigation = {
  name: string
  icon: typeof HomeIcon
  href: string
  exact?: boolean
  record?: 'quote' | 'invoice' | 'receipt'
  children?: Navigation[]
}

let navigation: Navigation[] = [
  { name: 'Dashboard', icon: HomeIcon, href: '/', exact: true },
  {
    name: 'Records',
    icon: RectangleStackIcon,
    href: '/records',
    children: [
      { name: 'Quotes', icon: CalculatorIcon, href: '/quote', record: 'quote' },
      { name: 'Invoices', icon: DocumentTextIcon, href: '/invoice', record: 'invoice' },
      { name: 'Receipts', icon: DocumentCheckIcon, href: '/receipt', record: 'receipt' },
    ],
  },
]

export default function Layout({
  children,
  data,
}: React.PropsWithChildren<{
  data: {
    me: Account
    records: Record[]
    stacks: { [id: string]: string[] }
  }
}>) {
  let pathname = usePathname()
  if (pathname?.includes('/raw')) {
    return <>{children}</>
  }

  function isActive(item: Navigation) {
    if (item.exact) {
      return item.href === pathname
    }

    let paths = pathname?.split('/').filter(Boolean)
    let myPaths = item.href.split('/').filter(Boolean)

    for (let [idx, path] of myPaths.entries()) {
      if (path !== paths[idx]) {
        return false
      }
    }

    return true
  }

  return (
    <RecordStacksProvider value={data.stacks}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-900 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <Link href="/" className="inline-flex items-center gap-2 text-lg text-white">
                <CubeIcon className="h-6 w-6 text-gray-200" /> Simple Invoice.
              </Link>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isActive(item)
                              ? 'bg-zinc-700 text-white'
                              : 'text-gray-400 hover:bg-zinc-700 hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                          )}
                        >
                          <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                          {item.name}
                        </Link>
                        {item.children && (
                          <ul className="ml-8 space-y-1 py-1">
                            {item.children
                              .filter((item) => {
                                if (!item.record) {
                                  return true
                                }

                                return data.records.some((record) => record.type === item.record)
                              })
                              .map((item) => {
                                let attentionCount = item.record
                                  ? data.records.filter(
                                      (record) =>
                                        record.type === item.record && recordHasWarning(record),
                                    ).length
                                  : 0

                                return (
                                  <li key={item.name}>
                                    <Link
                                      href={item.href}
                                      className={classNames(
                                        isActive(item)
                                          ? 'bg-zinc-700 text-white'
                                          : 'text-gray-400 hover:bg-zinc-700 hover:text-white',
                                        'group relative flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                                      )}
                                    >
                                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                      {item.name}
                                      {attentionCount > 0 && (
                                        <div className="absolute right-4 top-1/2 z-50 -translate-y-1/2">
                                          <span className="inline-flex items-center gap-3 rounded-md bg-red-400/10 px-3 py-1 text-xs font-medium text-red-200 ring-1 ring-inset ring-red-400/50">
                                            {attentionCount}
                                          </span>
                                        </div>
                                      )}
                                    </Link>
                                  </li>
                                )
                              })}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:pl-72">
          <main className="flex flex-1 flex-col overflow-hidden">
            <div className="isolate flex-1 overflow-auto">{children}</div>
          </main>
        </div>
      </div>
    </RecordStacksProvider>
  )
}
