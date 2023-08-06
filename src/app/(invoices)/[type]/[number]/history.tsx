'use client'

import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import * as React from 'react'
import { Fragment } from 'react'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { classNames } from '~/ui/class-names'
import { InvoiceProvider } from '~/ui/hooks/use-invoice'
import { match } from '~/utils/match'

type Entity = Quote | Invoice | Receipt

let HistoryContext = React.createContext<{
  options: Entity[]
  entity: Entity
  setEntity: (entity: Entity) => void
} | null>(null)

export function History(props: React.PropsWithChildren<{ entity: Entity }>) {
  let options: Entity[] = []
  if (props.entity.type === 'quote') {
    options.push(props.entity)
  } else if (props.entity.type === 'invoice') {
    if (props.entity.quote) options.push(props.entity.quote)
    options.push(props.entity)
  } else if (props.entity.type === 'receipt') {
    if (props.entity.invoice.quote) options.push(props.entity.invoice.quote)
    options.push(props.entity.invoice)
    options.push(props.entity)
  }

  let [entity, setEntity] = React.useState<Entity>(props.entity)

  return (
    <InvoiceProvider invoice={entity}>
      <HistoryContext.Provider value={{ options, entity, setEntity }}>
        {props.children}
      </HistoryContext.Provider>
    </InvoiceProvider>
  )
}

export function HistoryDropdown() {
  let ctx = React.useContext(HistoryContext)
  if (!ctx) throw new Error('HistoryAction must be used within History')
  let { options, entity, setEntity } = ctx

  if (options.length <= 1) return null

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-900">
          <ClockIcon
            className="-ml-1 h-5 w-5 text-gray-400 dark:text-zinc-500"
            aria-hidden="true"
          />
          History{' '}
          <span className="tabular-nums">
            ({options.indexOf(entity) + 1}/{options.length})
          </span>
          <ChevronDownIcon
            className="-mr-1 h-5 w-5 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800">
          <div className="py-1">
            {options.map((e) => {
              let Icon = e === entity ? CheckCircleIcon : 'span'

              return (
                <Menu.Item key={e.id}>
                  {({ active }) => (
                    <button
                      onClick={() => setEntity(e)}
                      className={classNames(
                        active
                          ? 'bg-gray-100 text-gray-900 dark:bg-zinc-900 dark:text-gray-200'
                          : 'text-gray-700 dark:text-zinc-400',
                        'group flex w-full items-center px-4 py-2 text-sm',
                      )}
                    >
                      <Icon
                        className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                        aria-hidden="true"
                      />
                      {match(e.type, {
                        quote: () => 'Quote',
                        invoice: () => 'Invoice',
                        receipt: () => 'Receipt',
                      })}
                    </button>
                  )}
                </Menu.Item>
              )
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
