'use client'

import { Disclosure } from '@headlessui/react'
import { Bars3Icon, CubeIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { classNames } from '~/ui/class-names'

let navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Invoices', href: '/invoices' },
]

export function Navbar() {
  let pathname = usePathname()
  if (pathname?.includes('/raw')) {
    return null
  }

  return (
    <Disclosure as="nav" className="sticky top-0 z-10 bg-gray-800 dark:bg-zinc-950 print:hidden">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <XMarkIcon className="ui-open:block ui-not-open:hidden h-6 w-6" aria-hidden="true" />
              <Bars3Icon className="ui-open:hidden ui-not-open:block h-6 w-6" aria-hidden="true" />
            </Disclosure.Button>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="inline-flex items-center gap-2 text-lg text-white">
                <CubeIcon className="h-6 w-6 text-gray-200" /> Simple Invoice.
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      item.href === pathname
                        ? 'bg-gray-900 text-white dark:bg-zinc-800'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white dark:hover:bg-zinc-700',
                      'rounded-md px-3 py-2 text-sm font-medium',
                    )}
                    aria-current={item.href === pathname ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Disclosure.Panel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <Disclosure.Button
              key={item.name}
              as={Link}
              href={item.href}
              className={classNames(
                item.href === pathname
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium',
              )}
              aria-current={item.href === pathname ? 'page' : undefined}
            >
              {item.name}
            </Disclosure.Button>
          ))}
        </div>
      </Disclosure.Panel>
    </Disclosure>
  )
}
