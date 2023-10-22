'use client'

import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, useMemo, useState } from 'react'

type Data = {
  open: boolean
}

type Controls = {
  open: () => void
  close: () => void
  toggle: () => void
}

export function useSidePanel() {
  let [open, setOpen] = useState(false)

  let data = useMemo<Data>(() => {
    return { open }
  }, [open])
  let controls = useMemo<Controls>(() => {
    return {
      open: () => {
        return setOpen(true)
      },
      close: () => {
        return setOpen(false)
      },
      toggle: () => {
        return setOpen((v) => {
          return !v
        })
      },
    }
  }, [setOpen])

  return [data, controls] as const
}

export function SidePanel({
  data,
  controls,
  title,
  children,
}: {
  data: Data
  controls: Controls
  title: string
  children: React.ReactNode
}) {
  return (
    <Transition.Root show={data.open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={controls.close}>
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-2 right-2 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col divide-y divide-gray-200 rounded-xl bg-white shadow-xl ring ring-white/10 backdrop-blur dark:divide-gray-900 dark:bg-zinc-900/95">
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-scroll py-6">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-gray-900 dark:text-zinc-300">
                            {title}
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 dark:bg-transparent"
                              onClick={controls.close}
                            >
                              <span className="absolute -inset-2.5" />
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">{children}</div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
