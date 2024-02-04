import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/solid'
import type { CSSProperties } from 'react'
import { me, suppliers, transactions } from '~/data'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { Money } from '~/ui/money'
import { DefaultMap } from '~/utils/default-map'

let dataBySupplierId = new DefaultMap(() => {
  return {
    count: 0,
    income: 0,
    expense: 0,
  }
})

for (let transaction of transactions) {
  let data = dataBySupplierId.get(transaction.supplier)
  data.count += 1
  if (transaction.amount > 0) {
    data.income += transaction.amount
  } else {
    data.expense += transaction.amount
  }
}

export default function Page() {
  return (
    <I18NProvider
      value={{
        language: me.language,
        currency: me.currency,
      }}
    >
      <div className="relative px-4 py-8 text-gray-600 sm:px-6 lg:px-8 dark:text-zinc-200">
        <ul
          role="list"
          className="grid grid-cols-1 gap-4 lg:grid-cols-[repeat(auto-fill,minmax(theme(spacing.96),1fr))]"
        >
          {suppliers.map((supplier) => {
            let data = dataBySupplierId.get(supplier)

            return (
              <li
                key={supplier}
                className="relative grid grid-cols-2 grid-rows-[1fr,auto] gap-px overflow-hidden rounded-md shadow ring-1 ring-black/5 group-data-[grouped]:shadow-none group-data-[grouped]:ring-0 [&>*]:bg-white [&>*]:dark:bg-zinc-900"
              >
                <span className="col-span-2 flex items-center justify-center p-4 text-center text-lg">
                  <Classified>{supplier}</Classified>
                </span>
                <div
                  className={classNames(
                    'relative grid grid-cols-[auto,1fr] gap-x-4 p-4',
                    data.income === 0 && 'grayscale',
                  )}
                >
                  <div
                    style={
                      {
                        '--width': `${(data.income / (Math.abs(data.income) + Math.abs(data.expense))) * 100}%`,
                      } as CSSProperties
                    }
                    className="absolute inset-1"
                  >
                    <div className="h-full w-[--width] rounded bg-green-500/5" />
                  </div>
                  <span className="row-span-2">
                    <ArrowUpIcon className="h-5 w-5 text-green-500" />
                  </span>
                  <Money amount={data.income} />
                  <span className="text-xs text-zinc-400">Income</span>
                </div>
                <div
                  className={classNames(
                    'relative grid grid-cols-[auto,1fr] gap-x-4 p-4',
                    data.expense === 0 && 'grayscale',
                  )}
                >
                  <div
                    style={
                      {
                        '--width': `${(data.expense / (Math.abs(data.income) + Math.abs(data.expense))) * 100}%`,
                      } as CSSProperties
                    }
                    className="absolute inset-1"
                  >
                    <div className="h-full w-[--width] rounded bg-red-500/5" />
                  </div>
                  <span className="row-span-2">
                    <ArrowDownIcon className="h-5 w-5 text-red-500" />
                  </span>
                  <Money amount={data.expense} />
                  <span className="text-xs text-zinc-400">Expense</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </I18NProvider>
  )
}
