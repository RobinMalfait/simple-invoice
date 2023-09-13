import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { useRecord } from '~/ui/hooks/use-record'
import { render } from '~/utils/tl'

export function Legal({ className }: { className?: string }) {
  let record = useRecord()
  let legal = [record.client.legal, record.account.legal]
    .filter(Boolean)
    .map((template) => render(template!, { account: record.account }))
  if (legal.length <= 0) return null

  return (
    <div className={classNames('whitespace-pre-wrap empty:hidden', className)}>
      {legal.map((line) => (
        <p key={line}>
          <Classified>{line}</Classified>
        </p>
      ))}
    </div>
  )
}
