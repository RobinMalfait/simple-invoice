import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { useRecord } from '~/ui/hooks/use-record'
import { Markdown } from '~/ui/markdown'
import { render } from '~/utils/tl'

export function Legal({ className }: { className?: string }) {
  let record = useRecord()
  let legal = [record.client.legal, record.account.legal].filter(Boolean).map((template) => {
    return render(template!, { account: record.account })
  })
  if (legal.length <= 0) return null

  return (
    <div className={classNames('whitespace-pre-wrap empty:hidden', className)}>
      <Classified>
        <Markdown>{legal.join('\n')}</Markdown>
      </Classified>
    </div>
  )
}
