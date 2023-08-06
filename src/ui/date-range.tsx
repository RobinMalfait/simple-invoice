import { format } from 'date-fns'

export function FormatRange({ start, end }: { start: Date | null; end: Date | null }) {
  if (start === null && end !== null) {
    return <div>&hellip; — {format(end, 'PPP')}</div>
  }

  if (start !== null && end === null) {
    return <div>{format(start, 'PPP')} — &hellip;</div>
  }

  if (start === null || end === null) {
    return null
  }

  return (
    <>
      {format(start, 'PPP')} — {format(end, 'PPP')}
    </>
  )
}
