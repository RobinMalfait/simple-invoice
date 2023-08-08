import { format, isSameDay } from 'date-fns'

export function FormatRange({ start, end }: { start: Date | null; end: Date | null }) {
  if (start === null && end !== null) {
    return <div className="tabular-nums">&hellip; — {format(end, 'PPP')}</div>
  }

  if (start !== null && end === null) {
    return <div className="tabular-nums">{format(start, 'PPP')} — &hellip;</div>
  }

  if (start === null || end === null) {
    return null
  }

  if (isSameDay(start, end)) {
    return <div className="tabular-nums">{format(start, 'PPP')}</div>
  }

  return (
    <div className="tabular-nums">
      {format(start, 'PPP')} — {format(end, 'PPP')}
    </div>
  )
}
