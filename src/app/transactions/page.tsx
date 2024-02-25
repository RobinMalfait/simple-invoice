import { compareDesc, format } from 'date-fns'
import { me, transactions } from '~/data'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { I18NPartialProvider, I18NProvider } from '~/ui/hooks/use-i18n'
import { Money } from '~/ui/money'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/ui/table'
import { StatusDisplay } from '~/ui/transaction/status'

transactions.sort((a, z) => {
  return compareDesc(a.date, z.date)
})

export default function Page() {
  return (
    <div className="relative flex min-h-full flex-col px-4 py-8 text-gray-600 sm:px-6 lg:px-8 dark:text-white">
      <I18NProvider
        value={{
          language: me.language,
          currency: me.currency,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Date</TableHeader>
              <TableHeader>Supplier</TableHeader>
              <TableHeader>Summary</TableHeader>
              <TableHeader>Category</TableHeader>
              <TableHeader className="text-right">Amount</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => {
              return (
                <I18NPartialProvider
                  key={transaction.id}
                  value={{ currency: transaction.currency }}
                >
                  <TableRow>
                    <TableCell>{format(transaction.date, 'yyyy-MM-dd')}</TableCell>
                    <TableCell>
                      <Classified>{transaction.supplier}</Classified>
                    </TableCell>
                    <TableCell>
                      <Classified>
                        {transaction.summary || <span className="text-sm">--</span>}
                      </Classified>
                    </TableCell>
                    <TableCell>
                      {transaction.category || <span className="text-sm">--</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money
                        className={classNames(
                          'px-2 py-1 font-medium',
                          transaction.amount > 0 &&
                            'shrink-0 rounded-md bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
                        )}
                        amount={transaction.amount}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusDisplay mini status={transaction.status} />
                    </TableCell>
                  </TableRow>
                </I18NPartialProvider>
              )
            })}
          </TableBody>
        </Table>
      </I18NProvider>
    </div>
  )
}
