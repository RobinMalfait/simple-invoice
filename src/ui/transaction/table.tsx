import { compareDesc, format } from 'date-fns'
import Link from 'next/link'
import type { Client } from '~/domain/client/client'
import type { Supplier } from '~/domain/supplier/supplier'
import type { Transaction } from '~/domain/transaction/transaction'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { I18NPartialProvider } from '~/ui/hooks/use-i18n'
import { Money } from '~/ui/money'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/ui/table'
import { StatusDisplay } from '~/ui/transaction/status'
import { match } from '~/utils/match'

export function TransactionsTable({
  viewContext = 'transaction',
  transactions,
}: {
  viewContext?: 'transaction' | 'supplier'
  transactions: Transaction[]
}) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Date</TableHeader>
          {viewContext === 'transaction' && <TableHeader>Supplier</TableHeader>}
          <TableHeader>Summary</TableHeader>
          <TableHeader>Category</TableHeader>
          <TableHeader className="text-right">Amount</TableHeader>
          <TableHeader>Status</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {transactions
          .slice()
          .sort((a, z) => {
            return compareDesc(a.date, z.date)
          })
          .map((transaction) => {
            return (
              <I18NPartialProvider key={transaction.id} value={{ currency: transaction.currency }}>
                <TableRow>
                  <TableCell>{format(transaction.date, 'yyyy-MM-dd')}</TableCell>
                  {viewContext === 'transaction' && (
                    <TableCell>
                      {match(
                        transaction.supplier.kind,
                        {
                          client(x: Client) {
                            return (
                              <Link href={`/clients/${x.id}`}>
                                <Classified>{x.nickname}</Classified>
                              </Link>
                            )
                          },
                          supplier(x: Supplier) {
                            return (
                              <Link href={`/suppliers/${x.id}`}>
                                <Classified>{x.nickname}</Classified>
                              </Link>
                            )
                          },
                        },
                        transaction.supplier,
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {transaction.record ? (
                      <Link
                        href={`/${transaction.record.type}/${transaction.record.number}`}
                        className="underline"
                      >
                        <Classified>
                          {transaction.summary || <span className="text-sm">--</span>}
                        </Classified>
                      </Link>
                    ) : (
                      <Classified>
                        {transaction.summary || <span className="text-sm">--</span>}
                      </Classified>
                    )}
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
  )
}
