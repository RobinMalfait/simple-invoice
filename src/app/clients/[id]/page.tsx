import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { MapIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Fragment } from 'react'
import { me, records } from '~/data'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import {
  isAccepted,
  isClosed,
  isCreditNote,
  isDraft,
  isExpired,
  isInvoice,
  isOverdue,
  isPaid,
  isPartiallyPaid,
  isQuote,
  isReceipt,
  isRejected,
  isSent,
} from '~/domain/record/filters'
import { combineRecords, separateRecords, type Record } from '~/domain/record/record'
import { Address, formatAddress } from '~/ui/address/address'
import { Avatar } from '~/ui/avatar'
import { Card, CardBody, CardTitle, Field } from '~/ui/card'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { Empty } from '~/ui/empty'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { Markdown } from '~/ui/markdown'
import { TinyRecord } from '~/ui/record/tiny-record'
import { TotalsByStatus } from '~/ui/record/totals-by-status'
import { TimezoneDifference } from '~/ui/timezone-difference'
import { ClientActivityFeed } from './activity-feed'

type RecordTab<T extends Record> = {
  label: string
  filter: (r: T) => boolean
  map?: (records: T[]) => T[]
  default?: boolean
  children?: Array<RecordTab<T>>
}

function tab<T extends Record>(tab: RecordTab<T>): RecordTab<T> {
  return tab
}

export default async function Page({ params: { id } }: { params: { id: string } }) {
  let combined = combineRecords(records)
  let client = combined.find((record) => {
    return record.client.id === id
  })?.client
  if (!client) {
    redirect('/')
  }
  let recordsForClient = combined.filter((record) => {
    return record.client.id === id
  })

  let allRecords = separateRecords(records)
  let systemContainsQuotes = allRecords.some((r) => {
    return isQuote(r)
  })
  let systemContainsInvoices = allRecords.some((r) => {
    return isInvoice(r)
  })
  let systemContainsCreditNotes = allRecords.some((r) => {
    return isCreditNote(r)
  })
  let systemContainsReceipts = allRecords.some((r) => {
    return isReceipt(r)
  })

  let tabs = [
    systemContainsQuotes &&
      tab<Quote>({
        label: 'Quotes',
        filter: isQuote,
        children: [
          { label: 'Draft', filter: isDraft },
          { label: 'Sent', filter: isSent },
          { label: 'Accepted', filter: isAccepted, default: true },
          { label: 'Rejected', filter: isRejected },
          { label: 'Expired', filter: isExpired },
          { label: 'Closed', filter: isClosed },
        ],
      }),
    systemContainsInvoices &&
      tab<Invoice>({
        label: 'Invoices',
        filter: isInvoice,
        children: [
          { label: 'Draft', filter: isDraft },
          { label: 'Sent', filter: isSent },
          { label: 'Paid', filter: isPaid, default: true },
          { label: 'Partially paid', filter: isPartiallyPaid },
          { label: 'Overdue', filter: isOverdue },
          { label: 'Closed', filter: isClosed },
        ],
      }),
    systemContainsCreditNotes &&
      tab<Receipt>({
        label: 'Credit notes',
        filter: isCreditNote,
        map: (list) => {
          return list.slice().reverse()
        },
      }),
    systemContainsReceipts &&
      tab<Receipt>({
        label: 'Receipts',
        filter: isReceipt,
        map: (list) => {
          return list.slice().reverse()
        },
      }),
  ].filter(Boolean) as RecordTab<any>[]

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of records.
        language: me.language,
        currency: client.currency,
      }}
    >
      <div className="relative px-4 py-8 text-gray-700 sm:px-6 lg:px-8 dark:text-zinc-400">
        <div className="flex items-center gap-4">
          <Avatar url={client.imageUrl} name={client.nickname} />

          <div>
            <h3 className="text-2xl">{client.nickname}</h3>
            <div className="text-sm">
              <Classified>{client.email}</Classified>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="grid grid-cols-1 gap-[inherit] xl:col-span-2">
            <Card>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span>Details</span>
                  <TotalsByStatus records={recordsForClient} />
                </div>
              </CardTitle>

              <CardBody variant="grid">
                {client.name && (
                  <Field classified title="Name">
                    {client.name}
                  </Field>
                )}
                {client.nickname !== client.name && (
                  <Field classified title="Nickname">
                    {client.nickname}
                  </Field>
                )}
                {client.email && (
                  <Field classified title="Email">
                    {client.email}
                  </Field>
                )}
                {client.phone && (
                  <Field classified title="Phone">
                    {client.phone}
                  </Field>
                )}
                {client.billing && (
                  <Field variant="block" title="Billing address">
                    <div className="flex items-center justify-between">
                      <Address address={client.billing} />
                      <a
                        title="Open in Google Maps"
                        target="_blank"
                        className="relative"
                        href={`https://www.google.com/maps/search/?${new URLSearchParams({
                          api: '1',
                          query: formatAddress(client.billing).replace(/\n/g, ', '),
                        })}`}
                      >
                        <span className="absolute -inset-3"></span>
                        <MapIcon className="h-5 w-5" />
                      </a>
                    </div>
                  </Field>
                )}
                {client.tax && (
                  <Field classified title={`Tax (${client.tax.id.toUpperCase()})`}>
                    {client.tax.value}
                  </Field>
                )}
                {client.timezone && (
                  <Field title="Timezone">
                    <span className="mr-4">{client.timezone}</span>
                    <TimezoneDifference myTimezone={me.timezone} otherTimezone={client.timezone} />
                  </Field>
                )}
                {client.note && (
                  <Field variant="block" title="Note">
                    <Markdown>{client.note}</Markdown>
                  </Field>
                )}
                {client.legal && (
                  <Field classified title="Legal" variant="block">
                    <Markdown>{client.legal}</Markdown>
                  </Field>
                )}

                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-gray-300 px-1.5 py-1 text-xs uppercase dark:border-zinc-600 dark:text-zinc-400">
                    {client.currency}
                  </span>
                  <span className="rounded-md border border-gray-300 px-1.5 py-1 text-xs uppercase dark:border-zinc-600 dark:text-zinc-400">
                    {client.language}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardTitle>Records ({recordsForClient.length})</CardTitle>
              <CardBody variant="filled">
                <RecordTabs records={recordsForClient} tabs={tabs} />
              </CardBody>
            </Card>
          </div>

          <div className="col-span-1 flex w-full flex-col gap-[inherit]">
            {client.contacts.length > 0 && (
              <Card>
                <CardTitle>Contacts</CardTitle>
                <CardBody>
                  <ul className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800">
                    {client.contacts.map((contact) => {
                      let fields = [
                        contact.nickname !== contact.name ? contact.nickname : null,
                        contact.phone,
                        contact.email,
                      ].filter(Boolean)

                      return (
                        <li key={contact.id} className="py-2 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            <Avatar size="sm" url={contact.imageUrl} name={contact.name} />
                            <div className="flex w-full flex-col justify-center">
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="flex flex-col">{contact.name}</span>
                                {contact.role && (
                                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30 ">
                                    {contact.role}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {fields.map((field, idx) => {
                                  return (
                                    <Fragment key={idx}>
                                      {idx !== 0 && <span>&middot;</span>}

                                      <div className="select-all text-xs">
                                        <Classified>{field}</Classified>
                                      </div>
                                    </Fragment>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </CardBody>
              </Card>
            )}

            <div>
              <ClientActivityFeed client={client} />
            </div>
          </div>
        </div>
      </div>
    </I18NProvider>
  )
}

function RecordTabs({ records, tabs }: { records: Record[]; tabs: RecordTab<any>[] }) {
  let defaultIndex = (() => {
    for (let [idx, tab] of tabs.entries()) {
      if (tab.default && records.some(tab.filter)) {
        return idx
      }
    }

    for (let [idx, tab] of tabs.entries()) {
      if (records.some(tab.filter)) {
        return idx
      }
    }

    return 0
  })()
  return (
    <TabGroup defaultIndex={defaultIndex}>
      <TabList className="border-b border-gray-200 dark:border-zinc-700">
        <div className="-mb-px flex space-x-8 overflow-auto">
          {tabs.map((tab, idx) => {
            let scopedRecords = tab.map
              ? tab.map(records.filter(tab.filter))
              : records.filter(tab.filter)
            return (
              <Tab
                key={idx}
                className={classNames(
                  'focus:outline-none',
                  'ui-selected:border-blue-500 ui-selected:text-blue-600 dark:ui-selected:border-blue-400 dark:ui-selected:text-blue-200',
                  'ui-not-selected:border-transparent ui-not-selected:text-gray-500 ui-not-selected:hover:border-gray-200 ui-not-selected:hover:text-gray-700 dark:ui-not-selected:hover:border-zinc-700 dark:ui-not-selected:hover:text-gray-300',
                  idx === 0 && 'pl-4',
                  'flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
                )}
              >
                {tab.label}
                <span
                  className={classNames(
                    'ring-inset ui-selected:bg-blue-100 ui-selected:text-blue-600 dark:ring-1 dark:ui-selected:bg-transparent dark:ui-selected:text-blue-200 dark:ui-selected:ring-blue-300 dark:ui-not-selected:bg-zinc-700 dark:ui-not-selected:ring-0',
                    'ui-not-selected:bg-gray-100 ui-not-selected:text-gray-900 dark:ui-not-selected:bg-zinc-300 dark:ui-not-selected:text-zinc-300',
                    'ml-3 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block',
                  )}
                >
                  {scopedRecords.length}
                </span>
              </Tab>
            )
          })}
        </div>
      </TabList>
      <TabPanels>
        {tabs.map((tab, idx) => {
          let scopedRecords = tab.map
            ? tab.map(records.filter(tab.filter))
            : records.filter(tab.filter)
          return (
            <TabPanel key={idx}>
              {tab.children ? (
                <RecordTabs records={scopedRecords} tabs={tab.children} />
              ) : (
                <RecordList records={scopedRecords} />
              )}
            </TabPanel>
          )
        })}
      </TabPanels>
    </TabGroup>
  )
}

function RecordList({ records }: { records: Record[] }) {
  if (records.length <= 0) {
    return (
      <div>
        <Empty variant="filled" message="No records found." />
      </div>
    )
  }

  return (
    <div className="grid auto-cols-[280px] grid-flow-col grid-cols-[repeat(auto-fill,280px)] grid-rows-1 gap-4 overflow-x-auto p-4 [scrollbar-width:auto]">
      {records.map((record) => {
        return (
          <I18NProvider
            key={record.id}
            value={{
              // Prefer the language of the account when looking at the overview of invoices.
              language: record.account.language,

              // Prefer the currency of the client when looking at the overview of invoices.
              currency: record.client.currency,
            }}
          >
            <Link href={`/${record.type}/${record.number}`}>
              <TinyRecord record={record} />
            </Link>
          </I18NProvider>
        )
      })}
    </div>
  )
}
