import React from 'react'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { match } from '~/utils/match'

export function Card({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="rounded-lg bg-[--bg] shadow ring-1 ring-black/5 [--bg:white] dark:text-gray-300 dark:[--bg:theme(colors.zinc.900)]">
      {children}
    </div>
  )
}

export function CardTitle({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="col-span-full block border-b border-gray-200 p-4 font-medium text-gray-900 dark:border-zinc-700 dark:text-gray-300">
      {children}
    </div>
  )
}

export function CardBody({
  children,
  variant = 'default',
}: React.PropsWithChildren<{ variant?: 'default' | 'embedded' | 'grid' }>) {
  return (
    <div
      className={classNames(
        match(variant, {
          default: 'p-4',
          embedded: '',
          grid: 'grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800 [&>*]:bg-[--bg] [&>*]:p-4',
        }),
      )}
    >
      {children}
      {variant === 'grid' && React.Children.toArray(children).filter(Boolean).length % 2 === 1 && (
        <div />
      )}
    </div>
  )
}

export function Field({
  title,
  children,
  classified = false,
  variant = 'text',
}: React.PropsWithChildren<{ title: string; variant?: 'text' | 'block'; classified?: boolean }>) {
  let Wrapper = classified ? Classified : React.Fragment
  return (
    <div>
      <div className="text-sm font-medium">{title}</div>
      <div
        className={classNames(
          'mt-1 text-sm',
          match(variant, {
            text: '',
            block: 'font-mono',
          }),
        )}
      >
        <Wrapper>{children}</Wrapper>
      </div>
    </div>
  )
}
