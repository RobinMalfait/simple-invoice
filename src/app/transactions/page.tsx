import { compareDesc, format } from 'date-fns'
import { me, transactions } from '~/data'
import { Transaction } from '~/domain/transaction/transaction'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { I18NPartialProvider, I18NProvider } from '~/ui/hooks/use-i18n'
import { Money } from '~/ui/money'
import { StatusDisplay } from '~/ui/transaction/status'
import { DefaultMap } from '~/utils/default-map'

export default function Page() {
  let groups = group(
    transactions.sort((a, z) => {
      return compareDesc(a.date, z.date)
    }),
  )

  return (
    <I18NProvider
      value={{
        language: me.language,
        currency: me.currency,
      }}
    >
      <div className="relative px-4 py-8 sm:px-6 lg:px-8 dark:text-white">
        <div className="grid grid-cols-[auto,auto,auto,auto,auto,1fr,auto,auto,auto] gap-4">
          <div className="sticky top-0 col-span-full grid grid-cols-[subgrid] items-center bg-white/20 py-2 font-medium backdrop-blur-sm dark:bg-zinc-800/20">
            <div className="col-start-3">Date</div>
            <div>Supplier</div>
            <div>Summary</div>
            <div>Category</div>
            <div className="text-right">Amount</div>
            <div />
          </div>
          {Array.from(groups).map(([year, quarters], yearIdx) => {
            return (
              <div key={yearIdx} className="col-span-full grid grid-cols-[subgrid] gap-4">
                <div className="sticky top-8 col-span-1 text-xl font-bold">{year}</div>

                {Array.from(quarters).map(([quarter, transactions], quarterIdx) => {
                  return (
                    <div
                      key={quarterIdx}
                      className="col-span-full col-start-2 grid grid-cols-[subgrid] gap-4"
                    >
                      <div className="sticky top-8 col-start-2 text-lg font-medium">{quarter}</div>

                      {transactions.map((transaction) => {
                        return (
                          <I18NPartialProvider
                            key={transaction.id}
                            value={{ currency: transaction.currency }}
                          >
                            <span className="col-start-3">
                              {format(transaction.date, 'yyyy-MM-dd')}
                            </span>
                            <div>
                              <Classified>{transaction.supplier}</Classified>
                            </div>
                            <div>
                              <Classified>
                                {transaction.summary || <span className="text-sm">--</span>}
                              </Classified>
                            </div>
                            <div>{transaction.category || <span className="text-sm">--</span>}</div>
                            <div className="text-right">
                              <Money
                                className={classNames(
                                  'px-2 py-1 font-medium',
                                  transaction.amount > 0 &&
                                    'shrink-0 rounded-md bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
                                )}
                                amount={transaction.amount}
                              />
                            </div>
                            <div>
                              <StatusDisplay mini status={transaction.status} />
                            </div>
                          </I18NPartialProvider>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </I18NProvider>
  )
}

function group(transactions: Transaction[]) {
  return transactions.reduce(
    (acc, transaction) => {
      acc.get(format(transaction.date, 'y')).get(format(transaction.date, 'QQQ')).push(transaction)
      return acc
    },
    new DefaultMap<string, DefaultMap<string, Transaction[]>>(() => {
      return new DefaultMap(() => {
        return []
      })
    }),
  )
}
