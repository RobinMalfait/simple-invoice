import { classNames } from '~/ui/class-names'
import { useInvoice } from '~/ui/hooks/use-invoice'

export function Legal({ className }: { className?: string }) {
  let invoice = useInvoice()
  let legal = [invoice.client.legal, invoice.account.legal].filter(Boolean)
  if (legal.length <= 0) return null

  return (
    <div className={classNames('whitespace-pre-wrap empty:hidden', className)}>
      {legal.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}
