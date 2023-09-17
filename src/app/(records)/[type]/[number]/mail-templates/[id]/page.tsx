import { EyeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { records } from '~/data'
import { classNames } from '~/ui/class-names'
import { CopyButton } from '~/ui/copy-button'
import { loadTemplate, loadTemplateList } from '../../actions'
import { RecipientCheckbox } from './recipient-checkbox'

export default async function Page({
  params,
  searchParams: { recipients = '' },
}: {
  params: { type: string; number: string; id: string }
  searchParams: { recipients?: string }
}) {
  let { type, number, id } = params
  let record = records.find((record) => record.type === type && record.number === number)
  if (!record) {
    redirect('/')
  }

  async function addRecipient(form: FormData) {
    'use server'

    let recipients = Array.from(form.keys())
      .filter((key) => /contacts\[(.*?)\]/g.test(key))
      .map((key) => /contacts\[(.*?)\]/g.exec(key)?.[1])
      .filter(Boolean) as string[]

    redirect(
      `/${type}/${number}/mail-templates/${id}?${new URLSearchParams({
        recipients: recipients.join(','),
      })}`,
    )
  }

  let [templates, template] = await Promise.all([
    loadTemplateList(record),
    loadTemplate(record, id, { recipients: recipients.split(',') }),
  ])

  if (!template) {
    redirect('/')
  }

  return (
    <div className="flex h-full w-full flex-1">
      <nav
        aria-label="Templates"
        className="hidden w-96 flex-shrink-0 border-r border-slate-200 bg-white dark:border-zinc-900 dark:bg-zinc-700 xl:flex xl:flex-col"
      >
        <div className="flex h-16 flex-shrink-0 items-center border-b border-slate-200 px-6 dark:border-zinc-500">
          <p className="text-lg font-medium text-slate-900 dark:text-zinc-300">Templates</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/${type}/${number}/mail-templates/${template.id}`}
              className={classNames(
                template.id === id
                  ? 'bg-blue-50/50 dark:bg-zinc-500/50'
                  : 'hover:bg-blue-50/50 dark:hover:bg-zinc-500/50',
                'flex border-b border-slate-200 p-6 dark:border-zinc-500',
              )}
              aria-current={template.id === id ? 'page' : undefined}
            >
              <EyeIcon
                className="-mt-0.5 h-6 w-6 flex-shrink-0 text-slate-400 dark:text-zinc-300"
                aria-hidden="true"
              />
              <div className="ml-3 text-sm">
                <p className="font-medium text-slate-900 dark:text-zinc-200">{template.name}</p>
                <p className="mt-1 text-slate-500 dark:text-zinc-300">{template.subject}</p>
              </div>
            </Link>
          ))}
        </div>
      </nav>
      <div className="w-full p-4 text-white">
        <div className="w-full flex-1 divide-y divide-gray-200 overflow-auto text-gray-600 dark:divide-zinc-700 dark:text-zinc-300">
          <div className="p-4">
            <span className="text-sm dark:text-zinc-400">Recipients</span>
            <form action={addRecipient}>
              <ul className="flex gap-2">
                {record.client.contacts.map((contact) => {
                  return (
                    <li key={contact.id}>
                      <label className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-2 py-1 pl-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30 ">
                        <RecipientCheckbox
                          name={`contacts[${contact.id}]`}
                          checked={recipients.split(',').includes(contact.id)}
                        />
                        {contact.name}
                      </label>
                    </li>
                  )
                })}
              </ul>
            </form>
          </div>
          <div className="p-4 font-mono">
            <CopyButton className="text-sm dark:text-zinc-400" text={template.subject}>
              Copy subject
            </CopyButton>

            <div
              dangerouslySetInnerHTML={{ __html: template?.subject ?? '' }}
              className="prose dark:prose-invert prose-p:m-0 prose-ul:m-0"
            />
          </div>

          <div className="p-4 font-mono">
            <CopyButton
              className="text-sm dark:text-zinc-400"
              text={template.body.text}
              html={template.body.html}
            >
              Copy body
            </CopyButton>

            <div
              dangerouslySetInnerHTML={{ __html: template?.body.html ?? '' }}
              className="prose dark:prose-invert prose-p:m-0 prose-blockquote:m-0 prose-ul:m-0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
