import * as HI from '@heroicons/react/24/outline'
import { BanknotesIcon, CalendarIcon, MapIcon } from '@heroicons/react/24/outline'
import { headers } from 'next/headers'
import React from 'react'
import { me } from '~/data'
import { Address, formatAddress } from '~/ui/address/address'
import { Avatar } from '~/ui/avatar'
import { Card, CardBody, CardTitle, Field } from '~/ui/card'
import { Classified } from '~/ui/classified'
import { DownloadLink } from '~/ui/download-link'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { PaypalIcon } from '~/ui/icons/payment'
import * as SocialIcons from '~/ui/icons/social'
import { Markdown } from '~/ui/markdown'
import { TimezoneDifference } from '~/ui/timezone-difference'
import { match } from '~/utils/match'
import { render } from '~/utils/tl'
import { AccountActivityFeed } from './activity-feed'

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
          <div className="grid grid-cols-1 items-start gap-[inherit] xl:col-span-2">
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
                    <Markdown>{account.note}</Markdown>
                  </Field>
                )}
                {account.legal && (
                  <Field classified title="Legal" variant="block">
                    <Markdown>{render(account.legal, { account })}</Markdown>
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

                <Field title="Actions" variant="block">
                  <div className="flex gap-2">
                    <a
                      className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 font-sans text-sm font-medium leading-4 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      href={`webcal://${base}/accounts/${account.id}/ics`}
                    >
                      <CalendarIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                      Add to calendar
                    </a>

                    <DownloadLink
                      className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 font-sans text-sm font-medium leading-4 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      href={`/accounts/${account.id}/backup/records`}
                    >
                      Download invoices
                    </DownloadLink>
                  </div>
                </Field>
              </CardBody>
            </Card>
          </div>

          <div className="col-span-1 flex w-full flex-col gap-[inherit]">
            {account.contactFields.length > 0 && (
              <Card>
                <CardTitle>Contact information</CardTitle>
                <CardBody variant="grid">
                  {account.contactFields.map((field) => {
                    let Icon =
                      field.icon === null
                        ? 'div'
                        : field.icon.type === 'heroicon'
                        ? HI[field.icon.heroicon]
                        : field.icon.type === 'socials'
                        ? SocialIcons[field.icon.name]
                        : field.icon.type === 'image'
                        ? function ImageIcon(props: React.ComponentProps<'img'>) {
                            // @ts-expect-error
                            // eslint-disable-next-line @next/next/no-img-element
                            return <img src={field.icon.imageUrl} alt="" {...props} />
                          }
                        : 'div'

                    return (
                      <Field key={field.id} classified title={field.name}>
                        <div title={field.value} className="flex items-center gap-3 text-sm">
                          <div className="text-center">
                            <Icon className="h-4 w-4 text-gray-500 grayscale dark:text-gray-400" />
                          </div>
                          <div className="truncate">{field.value}</div>
                        </div>
                      </Field>
                    )
                  })}
                </CardBody>
              </Card>
            )}

            {account.paymentMethods.length > 0 && (
              <Card>
                <CardTitle>Payment methods</CardTitle>
                <CardBody variant="grid">
                  {account.paymentMethods.map((paymentMethod) => {
                    return (
                      <Field
                        key={paymentMethod.id}
                        classified
                        title={match(paymentMethod.type, {
                          iban: () => {
                            return 'IBAN'
                          },
                          paypal: () => {
                            return 'PayPal'
                          },
                        })}
                      >
                        <div
                          title={paymentMethod.value}
                          className="flex items-center gap-3 text-sm"
                        >
                          <div className="text-center">
                            {match(paymentMethod.type, {
                              iban: () => {
                                return (
                                  <BanknotesIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                )
                              },
                              paypal: () => {
                                return (
                                  <PaypalIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                )
                              },
                            })}
                          </div>
                          <div className="truncate">{paymentMethod.value}</div>
                        </div>
                      </Field>
                    )
                  })}
                </CardBody>
              </Card>
            )}

            <AccountActivityFeed account={account} />
          </div>
        </div>
      </div>
    </I18NProvider>
  )
}
