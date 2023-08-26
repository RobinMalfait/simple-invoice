import { Combobox, Dialog, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { FolderIcon } from '@heroicons/react/24/outline'
import { Fragment, PropsWithChildren, createContext, useContext, useId, useState } from 'react'
import { classNames } from '~/ui/class-names'
import { useWindowEvent } from '~/ui/hooks/use-window-event'

let CommandPaletteContext = createContext<{ query: string }>({ query: '' })
function useCommandPalette() {
  return useContext(CommandPaletteContext)
}

export function CommandPalette({ children }: PropsWithChildren<{}>) {
  let [query, setQuery] = useState('')
  let [open, setOpen] = useState(false)

  // cmd+k
  useWindowEvent('keydown', (event) => {
    if (event.key === 'k' && (event.metaKey || event.ctrlKey) && !event.repeat) {
      event.preventDefault()
      setOpen((v) => !v)
    }
  })

  return (
    <Transition.Root show={open} as={Fragment} afterLeave={() => setQuery('')} appear>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-500/25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-zinc-500 divide-opacity-20 overflow-hidden rounded-xl bg-zinc-900 shadow-2xl transition-all">
              <Combobox<CommandPaletteOption>
                by="id"
                nullable
                onChange={async (item) => {
                  if (item === null) return
                  await Promise.resolve().then(() => item.invoke())
                  if (item.close ?? true) setOpen(false)
                }}
              >
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-white focus:ring-0 sm:text-sm"
                    placeholder="Search..."
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                <Combobox.Options
                  static
                  className="max-h-80 scroll-py-2 divide-y divide-zinc-500 divide-opacity-20 overflow-y-auto"
                >
                  <CommandPaletteContext.Provider value={{ query }}>
                    {children}
                  </CommandPaletteContext.Provider>
                </Combobox.Options>

                {false && query !== '' && [].length === 0 && (
                  <div className="px-6 py-14 text-center sm:px-14">
                    <FolderIcon className="mx-auto h-6 w-6 text-zinc-500" aria-hidden="true" />
                    <p className="mt-4 text-sm text-zinc-200">
                      We couldn&apos;t find any projects with that term. Please try again.
                    </p>
                  </div>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export function Group({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <li className="p-2 [&:has([data-children]:empty)]:hidden">
      <h2 className="mb-2 mt-4 px-3 text-xs font-semibold text-zinc-200">{title}</h2>
      <ul data-children className="text-sm text-zinc-400">
        {children}
      </ul>
    </li>
  )
}

type CommandPaletteOption = {
  id: string
  search: string
  close?: boolean
  type: 'action'
  invoke: () => void
}

function matches(needle: string, haystack: string) {
  let lastIdx = -1

  needle = needle.toLowerCase()
  haystack = haystack.toLowerCase()

  for (let c of needle) {
    if (c === ' ') continue

    let pos = haystack.indexOf(c, lastIdx + 1)
    if (pos === -1) return false

    lastIdx = pos
  }

  return true
}

export function Action({
  children,
  search,
  invoke,
  shortcut,
  icon: Icon = null,
  close,
}: PropsWithChildren<{
  search: string
  icon?: typeof MagnifyingGlassIcon | null
  shortcut?: string[]
  invoke: () => void
  close?: boolean
}>) {
  let id = useId()
  let isMac = navigator.userAgent.indexOf('Mac OS X') !== -1
  let { query } = useCommandPalette()

  if (!matches(query, search)) {
    return null
  }

  return (
    <Combobox.Option
      value={{ id, type: 'action', search, invoke, close }}
      className={({ active }) =>
        classNames(
          'flex cursor-default select-none items-center rounded-md px-3 py-2',
          active && 'bg-zinc-800 text-white',
        )
      }
    >
      {({ active }) => (
        <>
          {Icon && (
            <Icon
              className={classNames(
                'mr-3 h-6 w-6 flex-none',
                active ? 'text-white' : 'text-zinc-500',
              )}
              aria-hidden="true"
            />
          )}
          <span className="flex-auto truncate">{children}</span>
          {false && active && <span className="ml-3 flex-none text-zinc-400">Jump to...</span>}
          {shortcut && (
            <span className="ml-3 flex-none text-xs font-semibold text-gray-400">
              {shortcut.map((key, idx) => (
                <Fragment key={key}>
                  {!isMac && idx > 0 && ' + '}
                  <kbd className="font-sans">
                    {
                      // @ts-expect-error
                      (isMac ? KeyDisplayMac : KeyDisplayWindows)[key] ?? key
                    }
                  </kbd>
                </Fragment>
              ))}
            </span>
          )}
        </>
      )}
    </Combobox.Option>
  )
}

/// ---

enum KeyDisplayMac {
  ArrowUp = '↑',
  ArrowDown = '↓',
  ArrowLeft = '←',
  ArrowRight = '→',
  Home = '↖',
  End = '↘',
  Alt = '⌥',
  CapsLock = '⇪',
  Meta = '⌘',
  Cmd = '⌘',
  Shift = '⇧',
  Control = '⌃',
  Backspace = '⌫',
  Delete = '⌦',
  Enter = '↵',
  Escape = '⎋',
  Tab = '↹',
  PageUp = '⇞',
  PageDown = '⇟',
  ' ' = '␣',
}

enum KeyDisplayWindows {
  ArrowUp = '↑',
  ArrowDown = '↓',
  ArrowLeft = '←',
  ArrowRight = '→',
  Meta = 'Win',
  Cmd = 'Ctrl',
  Control = 'Ctrl',
  Backspace = '⌫',
  Delete = 'Del',
  Escape = 'Esc',
  PageUp = 'PgUp',
  PageDown = 'PgDn',
  ' ' = '␣',
}
