'use client'

import { Transition } from '@headlessui/react'
import { EyeIcon } from '@heroicons/react/24/outline'
import { ComponentProps, Fragment, useState } from 'react'
import { classNames } from '~/ui/class-names'
import { Dialog } from '~/ui/headlessui'
import { match } from '~/utils/match'

type Template = {
  id: string
  name: string
  subject: string
  body: {
    text: string
    html: string
  }
}

export function TemplateList({ templates }: { templates: Template[] }) {
  let [activeTemplate, setActiveTemplate] = useState<Template | null>(null)

  return (
    <>
      <ul role="list" className="space-y-1">
        {templates.map((template) => {
          return (
            <li key={template.id} className="relative flex gap-x-4">
              <button
                onClick={() => setActiveTemplate(template)}
                className="absolute inset-0 h-full w-full"
              />
              <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white dark:bg-zinc-900">
                <EyeIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
              </div>

              <p className="flex-auto py-0.5 text-xs leading-5 text-gray-600 dark:text-gray-300">
                {template.name}
              </p>
            </li>
          )
        })}
      </ul>
      <PreviewDialog
        templates={templates}
        activeTemplate={activeTemplate}
        choose={(template) => setActiveTemplate(template)}
        onClose={() => setActiveTemplate(null)}
      />
    </>
  )
}

function PreviewDialog({
  templates,
  activeTemplate,
  choose,
  onClose,
}: {
  templates: Template[]
  activeTemplate: Template | null
  choose: (template: Template) => void
  onClose: () => void
}) {
  return (
    <Transition.Root show={activeTemplate !== null} as={Fragment} appear>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
            <Dialog.Panel className="isolate mx-auto max-w-6xl transform divide-y divide-zinc-500 divide-opacity-20 overflow-hidden rounded-xl bg-white/80 shadow-2xl ring-1 ring-black/5 backdrop-blur transition-all dark:bg-zinc-900 dark:ring-0 dark:backdrop-blur-none">
              <div className="flex items-center justify-between p-4">
                <h3 className="text-xl font-medium text-zinc-600 dark:text-zinc-400">Templates</h3>
              </div>
              <div className="isolate flex h-full max-h-[90vh] overflow-hidden">
                <div className="flex min-w-[theme(spacing.40)] flex-col divide-y divide-gray-300 overflow-auto bg-gray-200 dark:divide-zinc-700 dark:bg-zinc-950">
                  {templates.map((template) => {
                    return (
                      <div key={template.id} className="p-2">
                        <button
                          type="button"
                          onClick={() => choose(template)}
                          className={classNames(
                            'w-full rounded px-4 py-1.5 text-left',
                            activeTemplate?.id === template.id
                              ? 'bg-gray-400 text-gray-200 dark:bg-blue-950 dark:text-blue-200'
                              : 'text-zinc-500',
                          )}
                        >
                          {template.name}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="w-full flex-1 divide-y divide-gray-200 overflow-auto text-gray-600 dark:divide-zinc-700 dark:text-zinc-300">
                  <div className="p-4 font-mono">
                    {activeTemplate && (
                      <CopyButton
                        className="text-xs dark:text-zinc-400"
                        text={activeTemplate.subject}
                      >
                        Copy subject
                      </CopyButton>
                    )}

                    <div
                      dangerouslySetInnerHTML={{ __html: activeTemplate?.subject ?? '' }}
                      className="prose dark:prose-invert prose-p:m-0 prose-ul:m-0"
                    />
                  </div>

                  <div className="p-4 font-mono">
                    {activeTemplate && (
                      <CopyButton
                        className="text-xs dark:text-zinc-400"
                        text={activeTemplate.body.text}
                        html={activeTemplate.body.html}
                      >
                        Copy body
                      </CopyButton>
                    )}

                    <div
                      dangerouslySetInnerHTML={{ __html: activeTemplate?.body.html ?? '' }}
                      className="prose dark:prose-invert prose-p:m-0 prose-blockquote:m-0 prose-ul:m-0"
                    />
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

function CopyButton({
  text,
  html,
  children,
  ...props
}: ComponentProps<'button'> & {
  text?: string
  html?: string
}) {
  let [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  return (
    <button
      onClick={async () => {
        let data = [
          new ClipboardItem(
            Object.fromEntries(
              [
                text != null ? ['text/plain', new Blob([text], { type: 'text/plain' })] : null,
                html != null ? ['text/html', new Blob([html], { type: 'text/html' })] : null,
              ].filter(Boolean) as [string, Blob][],
            ),
          ),
        ]
        await navigator.clipboard.write(data)
        setCopyStatus('copied')
        setTimeout(() => setCopyStatus('idle'), 3000)
      }}
      {...props}
    >
      {match(copyStatus, {
        idle: () => <>{children}</>,
        copied: () => <>Copied!</>,
      })}
    </button>
  )
}
