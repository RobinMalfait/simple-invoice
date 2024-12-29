import { MapIcon } from '@heroicons/react/24/outline'
import { redirect } from 'next/navigation'
import { transactions as allTransactions, me, suppliers } from '~/data'
import { Address, formatAddress } from '~/ui/address/address'
import { Avatar } from '~/ui/avatar'
import { Card, CardBody, CardTitle, Field } from '~/ui/card'
import { Classified } from '~/ui/classified'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TimezoneDifference } from '~/ui/timezone-difference'
import { TransactionsTable } from '~/ui/transaction/table'
import { SupplierActivityFeed } from './activity-feed'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  let { id } = await params
  let supplier = suppliers.find((s) => {
    return s.id === id
  })
  if (!supplier) {
    redirect('/')
  }
  let transactions = allTransactions.filter((t) => {
    return t.supplier.id === id
  })

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of records.
        language: me.language,
        currency: supplier.currency,
      }}
    >
      <div className="relative px-4 py-8 text-gray-700 sm:px-6 lg:px-8 dark:text-zinc-400">
        <div className="flex items-center gap-4">
          <Avatar url={supplier.imageUrl} name={supplier.nickname} />

          <div>
            <h3 className="text-2xl">{supplier.nickname}</h3>
            <div className="text-sm">
              <Classified>{supplier.email}</Classified>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="grid grid-cols-1 gap-[inherit] xl:col-span-2">
            <Card>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span>Details</span>
                </div>
              </CardTitle>

              <CardBody variant="grid">
                {supplier.name && (
                  <Field classified title="Name">
                    {supplier.name}
                  </Field>
                )}
                {supplier.nickname !== supplier.name && (
                  <Field classified title="Nickname">
                    {supplier.nickname}
                  </Field>
                )}
                {supplier.email && (
                  <Field classified title="Email">
                    {supplier.email}
                  </Field>
                )}
                {supplier.phone && (
                  <Field classified title="Phone">
                    {supplier.phone}
                  </Field>
                )}
                {supplier.address && (
                  <Field variant="block" title="Billing address">
                    <div className="flex items-center justify-between">
                      <Address address={supplier.address} />
                      <a
                        title="Open in Google Maps"
                        target="_blank"
                        className="relative"
                        href={`https://www.google.com/maps/search/?${new URLSearchParams({
                          api: '1',
                          query: formatAddress(supplier.address).replace(/\n/g, ', '),
                        })}`}
                      >
                        <span className="absolute -inset-3"></span>
                        <MapIcon className="h-5 w-5" />
                      </a>
                    </div>
                  </Field>
                )}
                {supplier.timezone && (
                  <Field title="Timezone">
                    <span className="mr-4">{supplier.timezone}</span>
                    <TimezoneDifference
                      myTimezone={me.timezone}
                      otherTimezone={supplier.timezone}
                    />
                  </Field>
                )}

                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-gray-300 px-1.5 py-1 text-xs uppercase dark:border-zinc-600 dark:text-zinc-400">
                    {supplier.currency}
                  </span>
                  <span className="rounded-md border border-gray-300 px-1.5 py-1 text-xs uppercase dark:border-zinc-600 dark:text-zinc-400">
                    {supplier.language}
                  </span>
                </div>
              </CardBody>
            </Card>

            {transactions.length > 0 && (
              <Card>
                <CardTitle>Transactions</CardTitle>
                <CardBody>
                  <TransactionsTable viewContext="supplier" transactions={transactions} />
                </CardBody>
              </Card>
            )}
          </div>

          <div className="col-span-1 flex w-full flex-col gap-[inherit]">
            <div>
              <SupplierActivityFeed supplier={supplier} />
            </div>
          </div>
        </div>
      </div>
    </I18NProvider>
  )
}
