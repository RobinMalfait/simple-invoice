'use client'

import {
  ArrowDownTrayIcon,
  CalculatorIcon,
  CubeIcon,
  DocumentCheckIcon,
  DocumentMinusIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  HomeIcon,
  RectangleStackIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Fragment, useMemo } from 'react'
import { DB, toggleClassified, toggleSidebar } from '~/app/(db)/actions'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { CreditNote } from '~/domain/credit-note/credit-note'
import { Event } from '~/domain/events/event'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { recordHasWarning } from '~/domain/record/filters'
import { Record } from '~/domain/record/record'
import { classNames } from '~/ui/class-names'
import { ClassifiedProvider } from '~/ui/classified'
import { Action, CommandPalette, Group } from '~/ui/command-palette'
import { DatabaseProvider } from '~/ui/hooks/use-db'
import { EventsProvider } from '~/ui/hooks/use-events-by'
import { RecordStacksProvider } from '~/ui/hooks/use-record-stacks'
import { RecordsProvider } from '~/ui/hooks/use-records'
import { match } from '~/utils/match'

type Navigation = {
  name: string
  icon: typeof HomeIcon
  href: string
  exact?: boolean
  record?: 'quote' | 'invoice' | 'credit-note' | 'receipt'
  children?: Navigation[]
}

let navigation: Navigation[] = [
  { name: 'Dashboard', icon: HomeIcon, href: '/', exact: true },
  { name: 'Clients', icon: UserGroupIcon, href: '/clients' },
  // // Use this once we actually have more accounts
  // {
  //   name: 'Accounts',
  //   icon: UsersIcon,
  //   href: '/accounts',
  //   exact: true,
  //   children: [{ name: 'Me', icon: UserIcon, href: '/accounts/me' }],
  // },
  { name: 'My account', icon: UserIcon, href: '/accounts/me' },
  {
    name: 'Records',
    icon: RectangleStackIcon,
    href: '/records',
    children: [
      { name: 'Quotes', icon: CalculatorIcon, href: '/quote', record: 'quote' },
      { name: 'Invoices', icon: DocumentTextIcon, href: '/invoice', record: 'invoice' },
      {
        name: 'Credit notes',
        icon: DocumentMinusIcon,
        href: '/credit-note',
        record: 'credit-note',
      },
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
    events: Event[]
    stacks: { [id: string]: string[] }

    clientById: [string, Client][]
    accountById: [string, Account][]
    quoteById: [string, Quote][]
    creditNoteById: [string, CreditNote][]
    invoiceById: [string, Invoice][]
    receiptById: [string, Receipt][]
  }
  config: DB
}>) {
  let router = useRouter()
  let params = useParams()

  let db = useMemo(() => {
    return {
      clientById: new Map<string, Client>(data.clientById),
      accountById: new Map<string, Account>(data.accountById),
      quoteById: new Map<string, Quote>(data.quoteById),
      invoiceById: new Map<string, Invoice>(data.invoiceById),
      creditNoteById: new Map<string, CreditNote>(data.creditNoteById),
      receiptById: new Map<string, Receipt>(data.receiptById),
    }
  }, [data])

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
      <DatabaseProvider db={db}>
        <EventsProvider events={data.events}>
          <RecordsProvider records={data.records}>
            <RecordStacksProvider value={data.stacks}>
              <div className="isolate flex flex-1 flex-col overflow-hidden selection:bg-pink-500/80 selection:text-pink-50">
                <div
                  className={classNames(
                    'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col',
                    match(config.ui.sidebar, {
                      large: 'lg:w-72',
                      small: 'lg:w-20',
                    }),
                  )}
                >
                  <div className="flex grow select-none flex-col gap-y-5 overflow-y-auto bg-zinc-900 px-6 pb-4">
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
                            {navigation.map((item) => {
                              return (
                                <li key={item.name} className="relative">
                                  {isActive(item) && (
                                    <motion.div
                                      layout
                                      layoutId="active-indicator"
                                      className="absolute -left-4 top-1 flex items-center"
                                    >
                                      <div className="h-8 w-1.5 rounded-r-md bg-white/90" />
                                    </motion.div>
                                  )}

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

                                          return data.records.some((record) => {
                                            return record.type === item.record
                                          })
                                        })
                                        .map((item) => {
                                          let attentionCount = item.record
                                            ? data.records.filter((record) => {
                                                return (
                                                  record.type === item.record &&
                                                  recordHasWarning(record)
                                                )
                                              }).length
                                            : 0

                                          return (
                                            <li key={item.name} className="relative">
                                              {isActive(item) && (
                                                <motion.div
                                                  layout
                                                  layoutId="active-indicator"
                                                  className={classNames(
                                                    'absolute top-1 flex items-center',
                                                    config.ui.sidebar === 'small'
                                                      ? '-left-4'
                                                      : '-left-12',
                                                  )}
                                                >
                                                  <div className="h-8 w-1.5 rounded-r-md bg-white/90" />
                                                </motion.div>
                                              )}

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
                              )
                            })}
                          </ul>
                        </li>
                        <li className="mt-auto">
                          <button
                            onClick={() => {
                              return toggleSidebar()
                            }}
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
                    <div className="relative z-10 hidden h-4 w-full shrink-0 bg-zinc-900 lg:flex">
                      <svg
                        className="absolute left-0 top-full h-4 w-4 -translate-x-0.5 -translate-y-0.5 text-zinc-900"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                      >
                        <defs>
                          <mask id="circle-cutout">
                            <rect width="16" height="16" fill="white" />
                            <circle cx="16" cy="16" r="14" fill="black" />
                          </mask>
                        </defs>

                        <rect
                          width="16"
                          height="16"
                          fill="currentColor"
                          mask="url(#circle-cutout)"
                        />
                      </svg>
                    </div>
                    <div className="relative isolate z-0 flex-1 overflow-auto">{children}</div>
                  </main>
                </div>
              </div>

              <CommandPalette>
                {/* Page specific actions */}
                {params.type &&
                  params.number &&
                  (() => {
                    let record = data.records.find((record) => {
                      return record.type === params.type && record.number === params.number
                    })
                    if (!record) return null

                    return (
                      <Group title="On this page">
                        <Action
                          icon={ArrowDownTrayIcon}
                          invoke={() => {
                            return window.open(`${window.location.href}/pdf`, '_blank')
                          }}
                          search={'download pdf'}
                        >
                          Download PDF
                        </Action>

                        <Action
                          icon={EyeIcon}
                          invoke={() => {
                            return window.open(`${window.location.href}/pdf?preview`, '_blank')
                          }}
                          search={'preview pdf'}
                        >
                          Preview PDF
                        </Action>

                        <Action
                          icon={UserIcon}
                          invoke={() => {
                            return router.push(`/clients/${record!.client.id}`)
                          }}
                          search={'go to client'}
                        >
                          Go to client — {record.client.nickname}
                        </Action>
                      </Group>
                    )
                  })()}

                {/* Generic sections */}
                <Group title="Quick links">
                  {navigation.map((item) => {
                    return (
                      <Fragment key={item.href}>
                        <Action
                          invoke={() => {
                            return router.push(item.href)
                          }}
                          icon={item.icon}
                          search={item.name}
                        >
                          {item.name}
                        </Action>
                      </Fragment>
                    )
                  })}
                </Group>

                {navigation
                  .filter((item) => {
                    return item.children
                  })
                  .map((item) => {
                    return (
                      <Group key={item.href} title={item.name}>
                        {item.children!.map((item) => {
                          return (
                            <Action
                              key={item.href}
                              invoke={() => {
                                return router.push(item.href)
                              }}
                              icon={item.icon}
                              search={item.name}
                            >
                              {item.name}
                            </Action>
                          )
                        })}
                      </Group>
                    )
                  })}

                <Group title="Actions">
                  <Action
                    icon={config.ui.classified ? EyeIcon : EyeSlashIcon}
                    invoke={() => {
                      return toggleClassified()
                    }}
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
                    invoke={() => {
                      return toggleSidebar()
                    }}
                    search="toggle sidebar"
                  >
                    Toggle sidebar
                  </Action>
                </Group>
              </CommandPalette>
            </RecordStacksProvider>
          </RecordsProvider>
        </EventsProvider>
      </DatabaseProvider>
    </ClassifiedProvider>
  )
}
