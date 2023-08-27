import { Combobox, Dialog, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { FolderIcon } from '@heroicons/react/24/outline'
import {
  Fragment,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react'
import { classNames } from '~/ui/class-names'
import { useWindowEvent } from '~/ui/hooks/use-window-event'
import { fuzzyMatch } from '~/utils/fuzzy'
import { tap } from '~/utils/tap'

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
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-zinc-500 divide-opacity-20 overflow-hidden rounded-xl bg-white/80 shadow-2xl ring-1 ring-black/5 backdrop-blur transition-all dark:bg-zinc-900 dark:ring-0 dark:backdrop-blur-none">
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
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 focus:ring-0 dark:text-white sm:text-sm"
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

let CommandPaletteGroupContext = createContext<{
  register: (id: string, matches: boolean) => void
}>({
  register() {},
})
export function Group({ title, children }: PropsWithChildren<{ title: string }>) {
  let [visibleChildren, setVisibleChildren] = useState(() => new Set<string>())

  let register = useCallback((id: string, matches: boolean) => {
    setVisibleChildren((x) => tap(new Set(x), (v) => (matches ? v.add(id) : v.delete(id))))
    return () => setVisibleChildren((x) => tap(new Set(x), (v) => v.delete(id)))
  }, [])

  return (
    <CommandPaletteGroupContext.Provider value={{ register }}>
      <li className={classNames('p-2', visibleChildren.size === 0 && 'hidden')}>
        <h2 className="mb-2 mt-4 px-3 text-xs font-semibold text-gray-900 dark:text-zinc-200">
          {title}
        </h2>
        <ul className="text-sm text-gray-700 dark:text-zinc-400">{children}</ul>
      </li>
    </CommandPaletteGroupContext.Provider>
  )
}

type CommandPaletteOption = {
  id: string
  search: string
  close?: boolean
  type: 'action'
  invoke: () => void
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
  icon?: React.ComponentType<any> | null
  shortcut?: string[]
  invoke: () => void
  close?: boolean
}>) {
  let id = useId()
  let isMac = navigator.userAgent.indexOf('Mac OS X') !== -1
  let { query } = useCommandPalette()

  let { register } = useContext(CommandPaletteGroupContext)
  let matches = fuzzyMatch(query, search)

  useEffect(() => register(id, matches), [register, id, matches])

  if (!matches) {
    return null
  }

  return (
    <Combobox.Option
      value={{ id, type: 'action', search, invoke, close }}
      className={({ active }) =>
        classNames(
          'flex cursor-default select-none items-center rounded-md px-3 py-2',
          active && 'bg-gray-900/5 text-gray-900 dark:bg-zinc-800 dark:text-white',
        )
      }
    >
      {({ active }) => (
        <>
          {Icon && (
            <Icon
              className={classNames(
                'mr-3 h-6 w-6 flex-none',
                active ? 'text-gray-900 dark:text-white' : 'text-gray-900/40 dark:text-zinc-500',
              )}
              aria-hidden="true"
            />
          )}
          <span className="flex-auto truncate">{children}</span>
          {false && active && <span className="ml-3 flex-none text-zinc-400">Jump to...</span>}
          {shortcut && (
            <span className="ml-3 flex-none text-xs font-semibold text-gray-500 dark:text-gray-400">
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
