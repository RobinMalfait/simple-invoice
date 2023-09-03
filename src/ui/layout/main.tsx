'use client'

import {
  ArrowDownTrayIcon,
  BriefcaseIcon,
  CalculatorIcon,
  CubeIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  HomeIcon,
  RectangleStackIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Fragment } from 'react'
import { DB, toggleClassified, toggleSidebar } from '~/app/(db)/actions'
import { Account } from '~/domain/account/account'
import { recordHasWarning } from '~/domain/record/filters'
import { Record } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { ClassifiedProvider } from '~/ui/classified'
import { Action, CommandPalette, Group } from '~/ui/command-palette'
import { RecordStacksProvider } from '~/ui/hooks/use-record-stacks'
import { RecordsProvider } from '~/ui/hooks/use-records'
import { match } from '~/utils/match'

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
  { name: 'Clients', icon: BriefcaseIcon, href: '/clients' },
  {
    name: 'Accounts',
    icon: UsersIcon,
    href: '/accounts',
    exact: true,
    children: [{ name: 'Me', icon: UserIcon, href: '/accounts/me' }],
  },
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
  config,
}: React.PropsWithChildren<{
  data: {
    me: Account
    records: Record[]
    stacks: { [id: string]: string[] }
  }
  config: DB
}>) {
  let router = useRouter()
  let params = useParams()

  let pathname = usePathname()
  if (pathname?.includes('/raw')) {
    return <ClassifiedProvider value={config.ui.classified}>{children}</ClassifiedProvider>
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
    <ClassifiedProvider value={config.ui.classified}>
      <RecordsProvider records={data.records}>
        <RecordStacksProvider value={data.stacks}>
          <div className="isolate flex flex-1 flex-col overflow-hidden">
            <div
              className={classNames(
                'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col',
                match(config.ui.sidebar, {
                  large: 'lg:w-72',
                  small: 'lg:w-20',
                }),
              )}
            >
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-900 px-6 pb-4">
                <div
                  className={classNames(
                    'flex h-16 shrink-0 items-center',
                    config.ui.sidebar === 'small' && 'justify-center',
                  )}
                >
                  <Link href="/" className="inline-flex items-center gap-2 text-lg text-white">
                    <CubeIcon className="h-6 w-6 text-gray-200" />
                    {config.ui.sidebar === 'large' && <> Simple Invoice.</>}
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
                                config.ui.sidebar === 'small' && 'justify-center',
                              )}
                            >
                              <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                              {config.ui.sidebar === 'large' && <>{item.name}</>}
                            </Link>
                            {item.children && (
                              <ul
                                className={classNames(
                                  'space-y-1 py-1',
                                  config.ui.sidebar === 'large' && 'ml-8',
                                )}
                              >
                                {item.children
                                  .filter((item) => {
                                    if (!item.record) {
                                      return true
                                    }

                                    return data.records.some(
                                      (record) => record.type === item.record,
                                    )
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
                                            config.ui.sidebar === 'small' && 'justify-center',
                                          )}
                                        >
                                          <item.icon
                                            className="h-6 w-6 shrink-0"
                                            aria-hidden="true"
                                          />
                                          {config.ui.sidebar === 'large' && (
                                            <>
                                              {item.name}
                                              {attentionCount > 0 && (
                                                <div className="absolute right-4 top-1/2 z-50 -translate-y-1/2">
                                                  <span className="inline-flex items-center gap-3 rounded-md bg-red-400/10 px-3 py-1 text-xs font-medium text-red-200 ring-1 ring-inset ring-red-400/50">
                                                    {attentionCount}
                                                  </span>
                                                </div>
                                              )}
                                            </>
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
                    <li className="mt-auto">
                      <button
                        onClick={() => toggleSidebar()}
                        className={classNames(
                          'flex w-full items-center gap-2 text-white opacity-50 transition-opacity hover:opacity-100',
                          config.ui.sidebar === 'small' && 'justify-center',
                          config.ui.sidebar === 'large' && 'justify-between',
                        )}
                      >
                        {config.ui.sidebar === 'large' && <span>Collapse sidebar</span>}
                        <div className="h-4 w-4 rounded border border-gray-200">
                          <div
                            className={classNames(
                              'h-full w-1 border-r border-gray-200',
                              config.ui.sidebar === 'large' && 'bg-gray-200',
                            )}
                          ></div>
                        </div>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>

            <div
              className={classNames(
                'flex flex-1 flex-col overflow-hidden',
                match(config.ui.sidebar, {
                  small: 'lg:pl-20',
                  large: 'lg:pl-72',
                }),
              )}
            >
              <main className="flex flex-1 flex-col overflow-hidden">
                <div className="isolate flex-1 overflow-auto">{children}</div>
              </main>
            </div>
          </div>

          <CommandPalette>
            {/* Page specific actions */}
            {params.type &&
              params.number &&
              (() => {
                let record = data.records.find(
                  (record) => record.type === params.type && record.number === params.number,
                )
                if (!record) return null

                return (
                  <Group title="On this page">
                    <Action
                      icon={ArrowDownTrayIcon}
                      invoke={() => window.open(`${window.location.href}/pdf`, '_blank')}
                      search={'download pdf'}
                    >
                      Download PDF
                    </Action>

                    <Action
                      icon={EyeIcon}
                      invoke={() => window.open(`${window.location.href}/pdf?preview`, '_blank')}
                      search={'preview pdf'}
                    >
                      Preview PDF
                    </Action>

                    <Action
                      icon={UserIcon}
                      invoke={() => router.push(`/clients/${record!.client.id}`)}
                      search={'go to client'}
                    >
                      Go to client — {record.client.name}
                    </Action>
                  </Group>
                )
              })()}

            {/* Generic sections */}
            <Group title="Quick links">
              {navigation.map((item) => (
                <Fragment key={item.href}>
                  <Action invoke={() => router.push(item.href)} icon={item.icon} search={item.name}>
                    {item.name}
                  </Action>
                </Fragment>
              ))}
            </Group>

            {navigation
              .filter((item) => item.children)
              .map((item) => (
                <Group key={item.href} title={item.name}>
                  {item.children!.map((item) => {
                    return (
                      <Action
                        key={item.href}
                        invoke={() => router.push(item.href)}
                        icon={item.icon}
                        search={item.name}
                      >
                        {item.name}
                      </Action>
                    )
                  })}
                </Group>
              ))}

            <Group title="Actions">
              <Action
                icon={config.ui.classified ? EyeIcon : EyeSlashIcon}
                invoke={() => toggleClassified()}
                search="toggle streamer mode"
              >
                Toggle streamer mode
              </Action>
              <Action
                icon={({ className, ...rest }) => {
                  return (
                    <div
                      className={classNames('flex items-center justify-center', className)}
                      {...rest}
                    >
                      <div className="h-4 w-4 rounded border border-current">
                        <div
                          className={classNames(
                            'h-full w-1 border-r border-current',
                            config.ui.sidebar === 'large' && 'bg-current',
                          )}
                        ></div>
                      </div>
                    </div>
                  )
                }}
                invoke={() => toggleSidebar()}
                search="toggle sidebar"
              >
                Toggle sidebar
              </Action>
            </Group>
          </CommandPalette>
        </RecordStacksProvider>
      </RecordsProvider>
    </ClassifiedProvider>
  )
}
