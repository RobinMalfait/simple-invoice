import * as marked from 'marked'
import { dedent } from '~/utils/dedent'

export function parse(value: string): string {
  return marked.parse(dedent(value)).trim()
}

export function MarkdownDocument({
  value,
  ...props
}: React.ComponentProps<'div'> & { value: string }) {
  let html = marked.parse(dedent(value))
  return <div dangerouslySetInnerHTML={{ __html: html }} {...props} />
}
