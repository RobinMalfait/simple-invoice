'use client'

import React from 'react'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { match } from '~/utils/match'

export function Card({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-1 flex-col rounded-lg bg-[--bg] shadow ring-1 ring-black/5 [--bg:white] dark:text-gray-300 dark:[--bg:theme(colors.zinc.900)]">
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

let CardStructureContext = React.createContext<
  'default' | 'filled' | 'filled-vertical' | 'filled-horizontal' | 'grid' | null
>(null)
export function CardStructureProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: React.ContextType<typeof CardStructureContext>
}) {
  return <CardStructureContext.Provider value={value}>{children}</CardStructureContext.Provider>
}
export function useCardStructure() {
  return React.useContext(CardStructureContext)
}

export function CardBody({
  children,
  variant = 'default',
}: React.PropsWithChildren<{
  variant?: 'default' | 'filled' | 'filled-vertical' | 'filled-horizontal' | 'grid'
}>) {
  return (
    <div
      className={classNames(
        'flex-1 overflow-hidden',
        match(variant, {
          default: 'p-4',
          filled: '',
          'filled-vertical': 'px-4',
          'filled-horizontal': 'py-4',
          grid: 'grid grid-cols-2 gap-px rounded-lg bg-gray-100 dark:bg-zinc-800 [&>*]:bg-[--bg] [&>*]:p-4',
        }),
      )}
    >
      <CardStructureProvider value={variant}>
        {children}
        {variant === 'grid' &&
          React.Children.toArray(children).filter(Boolean).length % 2 === 1 && <div />}
      </CardStructureProvider>
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
