import { CheckCircleIcon, MapIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'
import { me, records } from '~/data'
import { Invoice } from '~/domain/invoice/invoice'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'
import { Quote } from '~/domain/quote/quote'
import { QuoteStatus } from '~/domain/quote/quote-status'
import { Receipt } from '~/domain/receipt/receipt'
import { isInvoice, isPaidRecord, isQuote, isReceipt } from '~/domain/record/filters'
import { Record, combineRecords, separateRecords } from '~/domain/record/record'
import { Address, formatAddress } from '~/ui/address/address'
import { Avatar } from '~/ui/avatar'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { Empty } from '~/ui/empty'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '~/ui/headlessui'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { total } from '~/ui/invoice/total'
import { Money } from '~/ui/money'
import { TinyRecord } from '~/ui/record/tiny-record'
import { TimezoneDifference } from '~/ui/timezone-difference'
import { match } from '~/utils/match'

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
  let client = combined.find((record) => record.client.id === id)?.client
  if (!client) {
    redirect('/')
  }
  let recordsForClient = combined.filter((record) => record.client.id === id)
  let totalPaid = recordsForClient
    .filter((record) => isPaidRecord(record))
    .reduce((acc, record) => acc + total(record), 0)

  let allRecords = separateRecords(records)
  let systemContainsQuotes = allRecords.some((r) => isQuote(r))
  let systemContainsInvoices = allRecords.some((r) => isInvoice(r))
  let systemContainsReceipts = allRecords.some((r) => isReceipt(r))

  let tabs = [
    systemContainsQuotes &&
      tab<Quote>({
        label: 'Quotes',
        filter: isQuote,
        children: [
          { label: 'Draft', filter: (r) => r.status === QuoteStatus.Draft },
          { label: 'Sent', filter: (r) => r.status === QuoteStatus.Sent },
          { label: 'Accepted', filter: (r) => r.status === QuoteStatus.Accepted, default: true },
          { label: 'Rejected', filter: (r) => r.status === QuoteStatus.Rejected },
          { label: 'Expired', filter: (r) => r.status === QuoteStatus.Expired },
          { label: 'Closed', filter: (r) => r.status === QuoteStatus.Closed },
        ],
      }),
    systemContainsInvoices &&
      tab<Invoice>({
        label: 'Invoices',
        filter: isInvoice,
        children: [
          { label: 'Draft', filter: (r) => r.status === InvoiceStatus.Draft },
          { label: 'Sent', filter: (r) => r.status === InvoiceStatus.Sent },
          { label: 'Paid', filter: (r) => r.status === InvoiceStatus.Paid, default: true },
          {
            label: 'Partially paid',
            filter: (r) => r.status === InvoiceStatus.PartiallyPaid,
          },
          { label: 'Overdue', filter: (r) => r.status === InvoiceStatus.Overdue },
          { label: 'Closed', filter: (r) => r.status === InvoiceStatus.Closed },
        ],
      }),
    systemContainsReceipts &&
      tab<Receipt>({
        label: 'Receipts',
        filter: isReceipt,
        map: (list) => list.slice().reverse(),
      }),
  ].filter(Boolean) as RecordTab<any>[]

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of records.
        language: me.language,
        currency: me.currency,
      }}
    >
      <div className="relative px-4 py-8 text-gray-700 dark:text-zinc-400 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Avatar url={client.imageUrl} name={client.name} />

          <div>
            <h3 className="text-2xl">{client.name}</h3>
            <div className="text-sm">
              <Classified>{client.email}</Classified>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="col-span-2 grid grid-cols-1 gap-[inherit]">
            <Card>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span>Details</span>
                  <span
                    title="Paid"
                    className="inline-flex items-center gap-2 rounded-md bg-green-50 px-2 py-1 text-xs font-medium capitalize text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <Money amount={totalPaid} />
                  </span>
                </div>
              </CardTitle>

              <CardBody variant="grid">
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
                    {client.note}
                  </Field>
                )}
                {client.legal && (
                  <Field classified title="Legal" variant="block">
                    {client.legal}
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
              <CardBody variant="embedded">
                <RecordTabs records={recordsForClient} tabs={tabs} />
              </CardBody>
            </Card>
          </div>

          <div className="col-span-1"></div>
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
        <Empty variant="embedded" message="No records found." />
      </div>
    )
  }

  return (
    <div className="grid auto-cols-[280px] grid-flow-col grid-cols-[repeat(auto-fill,280px)] grid-rows-1 gap-4 overflow-x-auto p-4 [scrollbar-width:auto]">
      {records.map((record) => (
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
      ))}
    </div>
  )
}

function Card({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="rounded-lg bg-[--bg] shadow ring-1 ring-black/5 [--bg:white] dark:text-gray-300 dark:[--bg:theme(colors.zinc.900)]">
      {children}
    </div>
  )
}

function CardTitle({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="col-span-full block border-b border-gray-200 p-4 font-medium text-gray-900 dark:border-zinc-700 dark:text-gray-300">
      {children}
    </div>
  )
}

function CardBody({
  children,
  variant = 'default',
}: React.PropsWithChildren<{ variant?: 'default' | 'embedded' | 'grid' }>) {
  return (
    <div
      className={classNames(
        match(variant, {
          default: 'p-4',
          embedded: '',
          grid: 'grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800 [&>*]:bg-[--bg] [&>*]:p-4',
        }),
      )}
    >
      {children}
      {variant === 'grid' && React.Children.toArray(children).filter(Boolean).length % 2 === 1 && (
        <div />
      )}
    </div>
  )
}

function Field({
  title,
  children,
  classified = false,
  variant = 'text',
}: React.PropsWithChildren<{ title: string; variant?: 'text' | 'block'; classified?: boolean }>) {
  let Wrapper = classified ? Classified : React.Fragment
  return (
    <div>
      <div className="text-sm font-medium">{title}</div>
      <div
        className={classNames(
          'text-sm',
          match(variant, {
            text: '',
            block: 'font-mono',
          }),
        )}
      >
        <Wrapper>{children}</Wrapper>
      </div>
    </div>
  )
}
