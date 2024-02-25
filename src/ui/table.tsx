import type React from 'react'
import { classNames } from './class-names'

export function Table({ className, children, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className="flow-root">
      <div
        {...props}
        className={classNames(className, '-mx-[--gutter] overflow-x-auto whitespace-nowrap')}
      >
        <div className={classNames('inline-block min-w-full align-middle sm:px-[--gutter]')}>
          <table className="min-w-full divide-y divide-zinc-950/10 text-left text-sm/6 dark:divide-white/10">
            {children}
          </table>
        </div>
      </div>
    </div>
  )
}

export function TableHead(props: React.ComponentPropsWithoutRef<'thead'>) {
  return <thead {...props} />
}

export function TableBody({ className, ...props }: React.ComponentPropsWithoutRef<'tbody'>) {
  return (
    <tbody
      {...props}
      className={classNames(className, 'divide-y divide-zinc-950/5 dark:divide-white/5')}
    />
  )
}

export function TableRow({ title, children, ...props }: React.ComponentPropsWithoutRef<'tr'>) {
  return <tr {...props}>{children}</tr>
}

export function TableHeader({ className, ...props }: React.ComponentPropsWithoutRef<'th'>) {
  return (
    <th
      {...props}
      className={classNames(
        className,
        'px-4 py-2 font-medium text-zinc-500 first:pl-[var(--gutter,theme(spacing.2))] last:pr-[var(--gutter,theme(spacing.2))] sm:first:pl-2 sm:last:pr-2 dark:text-zinc-400',
      )}
    />
  )
}

export function TableCell({ className, children, ...props }: React.ComponentPropsWithoutRef<'td'>) {
  return (
    <td
      {...props}
      className={classNames(
        className,
        'relative px-4 py-2.5 first:pl-[var(--gutter,theme(spacing.2))] last:pr-[var(--gutter,theme(spacing.2))] sm:first:pl-2 sm:last:pr-2',
      )}
    >
      {children}
    </td>
  )
}
