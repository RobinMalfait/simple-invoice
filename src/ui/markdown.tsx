import { ComponentProps } from 'react'
import { parseMarkdown } from '~/ui/document/document'

export function Markdown({
  children,
  ...rest
}: Omit<ComponentProps<'div'>, 'children' | 'dangerouslySetInnerHTML'> & { children: string }) {
  return <div {...rest} dangerouslySetInnerHTML={{ __html: parseMarkdown(children) }} />
}
