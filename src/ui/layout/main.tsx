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
import { classNames } from '~/ui/class-names'

type Navigation = {
  name: string
  icon: typeof HomeIcon
  href: string
  exact?: boolean
  children?: Navigation[]
}

let navigation: Navigation[] = [
  { name: 'Dashboard', icon: HomeIcon, href: '/', exact: true },
  {
    name: 'Invoices',
    icon: RectangleStackIcon,
    href: '/invoices',
    children: [
      { name: 'Quotes', icon: CalculatorIcon, href: '/quote' },
      { name: 'Invoices', icon: DocumentTextIcon, href: '/invoice' },
      { name: 'Receipts', icon: DocumentCheckIcon, href: '/receipt' },
    ],
  },
]

export default function Layout({ children }: React.PropsWithChildren<{}>) {
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
    <>
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
                            {item.children.map((item) => (
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
                              </li>
                            ))}
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
    </>
  )
}
