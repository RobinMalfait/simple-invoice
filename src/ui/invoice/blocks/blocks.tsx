import * as HI from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { createContext, useContext, useMemo, useState } from 'react'

import type { Account } from '~/domain/account/account'
import { isInvoice } from '~/domain/record/filters'
import type { Record } from '~/domain/record/record'
import { Address as InternalAddress } from '~/ui/address/address'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'
import { collapse, expand, paginate, parseMarkdown, stringify } from '~/ui/document/document'
import { useAttachment } from '~/ui/hooks/use-attachment'
import { useFittedPagination } from '~/ui/hooks/use-fitted-pagination'
import { useIbanQrCodeData } from '~/ui/hooks/use-iban-qr-code-data'
import { useLocale } from '~/ui/hooks/use-locale'
import { PageProvider, usePaginationInfo } from '~/ui/hooks/use-pagination-info'
import { useRecord } from '~/ui/hooks/use-record'
import { useRecordItem } from '~/ui/hooks/use-record-item'
import { Translation, useTranslation } from '~/ui/hooks/use-translation'
import * as SocialIcons from '~/ui/icons/social'
import { total } from '~/ui/invoice/total'
import { Markdown } from '~/ui/markdown'
import { Money } from '~/ui/money'
import { OutletProvider } from '~/ui/outlet'
import { QRCode as QRCodeImage } from '~/ui/qr-code'
import { dot, type Dot } from '~/utils/dot'
import { match } from '~/utils/match'
import { render } from '~/utils/tl'

export function Address({
  for: who,
  ...props
}: React.ComponentProps<'div'> & { for: 'account' | 'client' }) {
  let record = useRecord()

  return (
    <InternalAddress
      address={match(who, {
        account: () => {
          return record.account.billing
        },
        client: () => {
          return record.client.billing
        },
      })}
      {...props}
    />
  )
}

// ---

export function Attachment({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  let document = useAttachment()
  let items = useMemo(() => {
    return match(document.type, {
      markdown: () => {
        return expand(parseMarkdown(document.value))
      },
      html: () => {
        return expand(document.value)
      },
    })
  }, [document])

  // @ts-expect-error I'll fix this later
  let [pages, FitContent, completed] = useFittedPagination(items, paginate)
  let [htmlCache] = useState(() => {
    return new Map<number, string>()
  })

  return (
    <>
      {pages.map(([items, done], pageIdx) => {
        if (done && !htmlCache.has(pageIdx)) {
          htmlCache.set(pageIdx, stringify(collapse(items)))
        }

        let html = done ? htmlCache.get(pageIdx)! : stringify(collapse(items))

        return (
          <PageProvider key={pageIdx} info={{ total: pages.length, current: pageIdx }}>
            <div
              id={pageIdx === 0 ? `attachment-${document.id}` : undefined}
              // Expose page related information
              data-first-page={pageIdx === 0 || undefined}
              data-even-page={pageIdx % 2 === 1 || undefined}
              data-odd-page={pageIdx % 2 === 0 || undefined}
              data-last-page={pageIdx === pages.length - 1 || undefined}
              data-single-page={pages.length === 1 || undefined}
              className={classNames(
                'paper relative mx-auto flex flex-col overflow-hidden print:m-0',
                className,
              )}
            >
              {!completed && (
                <div className="absolute inset-0 z-20 bg-black/10 backdrop-blur">
                  <div className="p-4 text-xl">
                    Computing <strong className="font-bold">{document.name}</strong>, please hold on
                    tight&hellip;
                  </div>
                </div>
              )}

              <OutletProvider value={<FitContent dangerouslySetInnerHTML={{ __html: html }} />}>
                {children}
              </OutletProvider>
            </div>
          </PageProvider>
        )
      })}
    </>
  )
}

// ---

export function Date({ date, format: formatString }: { date: Date; format: string }) {
  let locale = useLocale()

  return <>{format(date, formatString, { locale })}</>
}

// ---

export function Description(props: Omit<React.ComponentProps<typeof Markdown>, 'children'>) {
  let item = useRecordItem()
  return <Markdown {...props}>{item.description}</Markdown>
}

// ---

export function Quantity(props: React.ComponentProps<'span'>) {
  let item = useRecordItem()
  return <span {...props}>{item.quantity}</span>
}

// ---

let RecordItemsContext = createContext<Record['items'] | null>(null)
export function RecordItemsProvider({
  items,
  children,
}: React.PropsWithChildren<{ items: Record['items'] }>) {
  return <RecordItemsContext.Provider value={items}>{children}</RecordItemsContext.Provider>
}

function useRecordItems() {
  let context = useContext(RecordItemsContext)
  if (context === null) {
    let err = new Error(
      'useRecordItems() is used, but there is no parent <RecordItemsContext.Provider /> found.',
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useRecordItems)
    throw err
  }
  return context
}

export function Items({
  children,
}: {
  children: (_: { items: ReturnType<typeof useRecordItems> }) => React.ReactNode
}) {
  let items = useRecordItems()

  if (items === null) {
    return null
  }

  return <>{children({ items })}</>
}

// ---

export function Legal({ className, ...props }: React.ComponentProps<'div'>) {
  let record = useRecord()
  let legal = [record.client.legal, record.account.legal].filter(Boolean).map((template) => {
    return render(template!, { account: record.account })
  })
  if (legal.length <= 0) return null

  return (
    <div className={classNames('whitespace-pre-wrap empty:hidden', className)} {...props}>
      <Classified>
        <Markdown>{legal.join('\n')}</Markdown>
      </Classified>
    </div>
  )
}

// ---

function useNotes() {
  let record = useRecord()
  let notes = [record.note, record.client.note, record.account.note].filter(Boolean)
  return notes
}

export function Notes({
  children,
  ...props
}: { children?: React.ReactNode } & Omit<React.ComponentProps<typeof Markdown>, 'children'>) {
  let notes = useNotes()

  if (notes.length <= 0) {
    return null
  }

  if (children) {
    return (
      <div {...props}>
        <OutletProvider value={<Markdown>{notes.join('\n')}</Markdown>}>{children}</OutletProvider>
      </div>
    )
  }

  return <Markdown {...props}>{notes.join('\n')}</Markdown>
}

// ---

export function Pagination(props: React.ComponentProps<'span'>) {
  let { total, current } = usePaginationInfo()
  return (
    <Translation
      {...props}
      for="pagination.summary"
      interpolations={{
        current: current + 1,
        total,
      }}
    />
  )
}

// ---

function useQRCodeData() {
  let record = useRecord()
  let qrCodeData = useIbanQrCodeData(record)

  let isQRCodeEnabled =
    isInvoice(record) && (record.qr ?? record.client.qr ?? record.account.qr ?? false)

  if (!isQRCodeEnabled) {
    return null
  }

  return qrCodeData
}

export function QRCode({
  children,
  margin,
  scale = 3,
  ...props
}:
  | ({ children: React.ReactNode } & Omit<React.ComponentProps<typeof QRCodeImage>, 'children'> &
      Omit<React.ComponentProps<'div'>, 'children'>)
  | ({ children?: never } & Omit<React.ComponentProps<typeof QRCodeImage>, 'children'>)) {
  let qrCodeData = useQRCodeData()
  if (qrCodeData === null) {
    return null
  }

  let contents = (
    <Classified>
      <QRCodeImage margin={margin} scale={scale}>
        {qrCodeData}
      </QRCodeImage>
    </Classified>
  )

  if (children) {
    return (
      <div {...props}>
        <OutletProvider value={contents}>{children}</OutletProvider>
      </div>
    )
  }

  return contents
}

// ---

export function Record({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  let record = useRecord()
  let [pages, FitContent] = useFittedPagination(record.items)

  return (
    <>
      {pages.map(([items], pageIdx) => {
        return (
          <PageProvider key={pageIdx} info={{ total: pages.length, current: pageIdx }}>
            <div
              // Expose page related information
              data-first-page={pageIdx === 0 || undefined}
              data-even-page={pageIdx % 2 === 1 || undefined}
              data-odd-page={pageIdx % 2 === 0 || undefined}
              data-last-page={pageIdx === pages.length - 1 || undefined}
              data-single-page={pages.length === 1 || undefined}
              className={classNames('paper relative mx-auto flex flex-col print:m-0', className)}
            >
              <RecordItemsProvider items={items}>
                <OutletProvider value={<FitContent />}>{children}</OutletProvider>
              </RecordItemsProvider>
            </div>
          </PageProvider>
        )
      })}
    </>
  )
}

// ---

export function TaxRate() {
  let item = useRecordItem()

  return <>{`${((item.taxRate ?? 0) * 100).toFixed(0)}%`}</>
}

export function TaxLabel({
  for: who,
  ...props
}: React.ComponentProps<'span'> & { for: 'account' | 'client' }) {
  let record = useRecord()
  let t = useTranslation()

  return (
    <span {...props}>
      {t((x) => {
        return match(who, {
          account: () => {
            return x.account.taxId[record.account.tax!.id]
          },
          client: () => {
            return x.client.taxId[record.client.tax!.id]
          },
        })
      })}
    </span>
  )
}

export function Total(props: React.ComponentProps<'div'>) {
  let record = useRecord()

  return (
    <div {...props}>
      <Money
        amount={match(record.type, {
          quote: () => {
            return total(record)
          },
          invoice: () => {
            return total(record)
          },
          'credit-note': () => {
            return total(record)
          },
          receipt: () => {
            return 0
          },
        })}
      />
    </div>
  )
}

// ---

export function Type(props: React.ComponentProps<'span'>) {
  let record = useRecord()

  return (
    <Translation
      {...props}
      for={match(record.type, {
        quote: 'quote.title',
        invoice: 'invoice.title',
        'credit-note': 'credit-note.title',
        receipt: 'receipt.title',
      })}
    />
  )
}

// ---

export function Value({
  of: path,
  ...props
}: {
  of: RecordPaths | AccountPaths | AttachmentPaths | ClientPaths
} & React.ComponentProps<'span'>) {
  if (path.startsWith('account.')) {
    return <AccountValue path={path as AccountPaths} {...props} />
  }

  if (path.startsWith('attachment.')) {
    return <AttachmentValue path={path as AttachmentPaths} {...props} />
  }

  if (path.startsWith('client.')) {
    return <ClientValue path={path as ClientPaths} {...props} />
  }

  return <RecordValue path={path as RecordPaths} {...props} />
}

type AccountPaths = `account.${Dot<Record['account']>}`
function AccountValue({ path, ...props }: { path: AccountPaths } & React.ComponentProps<'span'>) {
  let record = useRecord()
  return <span {...props}>{dot(record, path)}</span>
}

type AttachmentPaths = 'attachment.name'
function AttachmentValue({
  path,
  ...props
}: { path: AttachmentPaths } & React.ComponentProps<'span'>) {
  let attachment = useAttachment()
  return <span {...props}>{dot({ attachment }, path)}</span>
}

type ClientPaths = `client.${Dot<Record['client']>}`
function ClientValue({ path, ...props }: { path: ClientPaths } & React.ComponentProps<'span'>) {
  let record = useRecord()
  return <span {...props}>{dot(record, path)}</span>
}

type RecordPaths = Dot<Record>
function RecordValue({ path, ...props }: { path: RecordPaths } & React.ComponentProps<'span'>) {
  let record = useRecord()
  return <span {...props}>{dot(record, path)}</span>
}

// ---

export function ContactFieldIcon({
  field,
  ...props
}: {
  className?: string
  field: Account['contactFields'][number]
}) {
  let Icon =
    field.icon === null
      ? 'div'
      : field.icon.type === 'heroicon'
        ? HI[field.icon.heroicon]
        : field.icon.type === 'socials'
          ? SocialIcons[field.icon.name]
          : field.icon.type === 'image'
            ? function ImageIcon(props: React.ComponentProps<'img'>) {
                // @ts-expect-error
                // eslint-disable-next-line @next/next/no-img-element
                return <img src={field.icon.imageUrl} alt="" {...props} />
              }
            : 'div'
  return <Icon {...props} />
}
