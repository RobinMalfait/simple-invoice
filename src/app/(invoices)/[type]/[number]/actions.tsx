'use client'

import { EyeIcon } from '@heroicons/react/24/outline'
import { formatISO9075, parseISO } from 'date-fns'
// @ts-expect-error
import estreePlugin from 'prettier/plugins/estree'
import tsPlugin from 'prettier/plugins/typescript'
import * as prettier from 'prettier/standalone'
import { useCallback, useState } from 'react'
import { isAccepted, isQuote } from '~/domain/entity-filters'
import { DownloadLink } from '~/ui/download-link'
import { useCurrencyFormatter } from '~/ui/hooks/use-currency-formatter'
import { useInvoice } from '~/ui/hooks/use-invoice'
import { total } from '~/ui/invoice/total'
import { SidePanel, useSidePanel } from '~/ui/side-panel'
import { match } from '~/utils/match'

let ts = String.raw

function Label(props: React.ComponentProps<'label'>) {
  return (
    <label
      className="block text-sm font-medium leading-6 text-gray-900 dark:text-white"
      {...props}
    />
  )
}

function Input(props: React.ComponentProps<'input'>) {
  return (
    <input
      type="text"
      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-blue-500 sm:text-sm sm:leading-6"
      {...props}
    />
  )
}

function Checkbox(props: React.ComponentProps<'input'>) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-blue-600 dark:focus:ring-offset-gray-900"
      {...props}
    />
  )
}

function InputField({
  label,
  description,
  optional = false,
  ...props
}: React.ComponentProps<'input'> & {
  label: string
  description?: string
  optional?: boolean
}) {
  return (
    <div>
      <Label htmlFor={props.id}>
        {label}
        {optional ? (
          <>
            {' '}
            <small>(optional)</small>
          </>
        ) : null}
        :
      </Label>
      <div className="mt-2">
        <Input {...props} />
        {description && <p className="text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    </div>
  )
}

function CheckboxField({
  label,
  description,
  ...props
}: React.ComponentProps<'input'> & {
  label: string
  description?: string
}) {
  return (
    <div className="relative flex gap-x-3">
      <div className="flex h-6 items-center">
        <Checkbox {...props} />
      </div>
      <div className="text-sm leading-6">
        <Label htmlFor={props.id}>{label}</Label>
        {description && <p className="text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    </div>
  )
}

export function Actions() {
  let entity = useInvoice()

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between text-center">
        <DownloadLink
          className="inline-flex items-center justify-center"
          href={`/${entity.type}/${entity.number}/pdf`}
        >
          Download PDF
        </DownloadLink>

        <a
          className="inline-flex items-center justify-center"
          target="_blank"
          href={`/${entity.type}/${entity.number}/pdf?preview`}
        >
          <EyeIcon className="mr-2 h-4 w-4" />
          <span>Preview PDF</span>
        </a>
      </div>

      {isQuote(entity) && isAccepted(entity) && <PromoteToInvoicePanel />}
    </div>
  )
}

function PromoteToInvoicePanel() {
  let entity = useInvoice()

  let [data, controls] = useSidePanel()
  let [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  let formatter = useCurrencyFormatter()

  let copyInvoiceCode = useCallback(
    (data: { issueDate?: string; dueDate?: string; withAttachments?: 'on' }) => {
      let withAttachments = entity.attachments.length > 0 ? data.withAttachments === 'on' : null
      prettier
        .format(
          ts`
            invoices.push(InvoiceBuilder.fromQuote(
              // ${entity.client.name} — (#${entity.number}, ${formatter.format(
                total(entity) / 100,
              )})
              invoices.find(entity => entity.type === 'quote' && entity.number === "${
                entity.number
              }") as Quote
              ${withAttachments === false ? ',{withAttachments:false}' : ''}
            )${data.issueDate ? `.issueDate('${formatISO9075(parseISO(data.issueDate))}')` : ''}${
              data.dueDate ? `.dueDate('${formatISO9075(parseISO(data.dueDate))}')` : ''
            }.build())
          `,
          {
            parser: 'typescript',
            plugins: [estreePlugin, tsPlugin],
            singleQuote: true,
            semi: false,
          },
        )
        .then((code) => {
          navigator.clipboard.writeText(code)
        })
        .then(() => {
          setCopyStatus('copied')
          setTimeout(() => setCopyStatus('idle'), 3000)
        })
    },
    [entity, formatter],
  )

  let [issueDate, setIssueDate] = useState<Date | null>(new Date())

  if (!isQuote(entity) || !isAccepted(entity)) {
    return null
  }

  return (
    <div>
      <button
        onClick={controls.open}
        className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:ring-zinc-900"
      >
        Promote to Invoice
      </button>

      <SidePanel data={data} controls={controls} title="Promote to Invoice">
        <form
          className="flex flex-col gap-8"
          onSubmit={(e) => {
            e.preventDefault()
            copyInvoiceCode(Object.fromEntries(new FormData(e.target as HTMLFormElement)))
          }}
        >
          <InputField
            id="issueDate"
            name="issueDate"
            label="Issue date"
            type="datetime-local"
            value={issueDate?.toISOString().slice(0, 16) ?? ''}
            onChange={(e) => setIssueDate(e.target.value === '' ? null : parseISO(e.target.value))}
          />

          <InputField
            optional
            id="dueDate"
            name="dueDate"
            label="Due date"
            type="datetime-local"
            min={issueDate?.toISOString().slice(0, 16)}
          />

          {entity.attachments.length > 0 && (
            <CheckboxField
              defaultChecked
              id="withAttachments"
              name="withAttachments"
              label="With attachments"
              description="Whether or not the attachments from the quote should be inherited by the invoice."
            />
          )}

          <button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-900">
            {match(copyStatus, {
              idle: () => 'Copy code to clipboard',
              copied: () => 'Copied!',
            })}
          </button>
        </form>
      </SidePanel>
    </div>
  )
}
