import { redirect } from 'next/navigation'
import { me, transactions } from '~/data'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { TransactionsTable } from '~/ui/transaction/table'

export default function Page() {
  if (transactions.length === 0) {
    return redirect('/')
  }

  return (
    <div className="relative flex min-h-full flex-col px-4 py-8 text-gray-600 sm:px-6 lg:px-8 dark:text-white">
      <I18NProvider
        value={{
          language: me.language,
          currency: me.currency,
        }}
      >
        <TransactionsTable transactions={transactions} />
      </I18NProvider>
    </div>
  )
}
