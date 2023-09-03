import { CalendarIcon, MapIcon } from '@heroicons/react/24/outline'
import { headers } from 'next/headers'
import React from 'react'
import { me } from '~/data'
import { Address, formatAddress } from '~/ui/address/address'
import { Avatar } from '~/ui/avatar'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TimezoneDifference } from '~/ui/timezone-difference'
import { match } from '~/utils/match'

export default async function Page({ params: { id } }: { params: { id: string } }) {
  let base = headers().get('host')
  let account = me

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
          <Avatar url={account.imageUrl} name={account.name} />

          <div>
            <h3 className="text-2xl">{account.name}</h3>
            <div className="text-sm">
              <Classified>{account.email}</Classified>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="col-span-2 grid grid-cols-1 gap-[inherit]">
            <Card>
              <CardTitle>Details</CardTitle>

              <CardBody variant="grid">
                {account.email && (
                  <Field classified title="Email">
                    {account.email}
                  </Field>
                )}
                {account.phone && (
                  <Field classified title="Phone">
                    {account.phone}
                  </Field>
                )}
                {account.billing && (
                  <Field variant="block" title="Billing address">
                    <div className="flex items-center justify-between">
                      <Address address={account.billing} />
                      <a
                        title="Open in Google Maps"
                        target="_blank"
                        className="relative"
                        href={`https://www.google.com/maps/search/?${new URLSearchParams({
                          api: '1',
                          query: formatAddress(account.billing).replace(/\n/g, ', '),
                        })}`}
                      >
                        <span className="absolute -inset-3"></span>
                        <MapIcon className="h-5 w-5" />
                      </a>
                    </div>
                  </Field>
                )}
                {account.tax && (
                  <Field classified title={`Tax (${account.tax.id.toUpperCase()})`}>
                    {account.tax.value}
                  </Field>
                )}
                {account.timezone && (
                  <Field title="Timezone">
                    <span className="mr-4">{account.timezone}</span>
                    <TimezoneDifference myTimezone={me.timezone} otherTimezone={account.timezone} />
                  </Field>
                )}
                {account.note && (
                  <Field variant="block" title="Note">
                    {account.note}
                  </Field>
                )}
                {account.legal && (
                  <Field classified title="Legal" variant="block">
                    {account.legal}
                  </Field>
                )}

                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-gray-300 px-1.5 py-1 text-xs uppercase dark:border-zinc-600 dark:text-zinc-400">
                    {account.currency}
                  </span>
                  <span className="rounded-md border border-gray-300 px-1.5 py-1 text-xs uppercase dark:border-zinc-600 dark:text-zinc-400">
                    {account.language}
                  </span>
                </div>

                <Field title="iCal" variant="block">
                  <a
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    href={`webcal://${base}/accounts/${account.id}/ics`}
                  >
                    <CalendarIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                    Add to calendar
                  </a>
                </Field>
              </CardBody>
            </Card>
          </div>

          <div className="col-span-1">...</div>
        </div>
      </div>
    </I18NProvider>
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
