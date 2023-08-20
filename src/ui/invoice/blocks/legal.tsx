import { classNames } from '~/ui/class-names'
import { useRecord } from '~/ui/hooks/use-record'

export function Legal({ className }: { className?: string }) {
  let record = useRecord()
  let legal = [record.client.legal, record.account.legal].filter(Boolean)
  if (legal.length <= 0) return null

  return (
    <div className={classNames('whitespace-pre-wrap empty:hidden', className)}>
      {legal.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}
