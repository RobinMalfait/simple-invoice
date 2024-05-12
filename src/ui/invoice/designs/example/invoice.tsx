import { BanknotesIcon, CubeIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

import { CreditNote } from '~/domain/credit-note/credit-note'
import { Discount } from '~/domain/discount/discount'
import { Invoice as InvoiceType } from '~/domain/invoice/invoice'
import { summary, type Summary } from '~/domain/invoice/summary'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { Classified } from '~/ui/classified'
import { usePaginationInfo } from '~/ui/hooks/use-pagination-info'
import { useRecord } from '~/ui/hooks/use-record'
import { useRecordInfo } from '~/ui/hooks/use-record-info'
import { RecordItemProvider } from '~/ui/hooks/use-record-item'
import { Translation, useTranslation } from '~/ui/hooks/use-translation'
import { PaypalIcon } from '~/ui/icons/payment'
import {
  Address,
  Attachment as AttachmentBlock,
  ContactFieldIcon,
  Date,
  Description,
  Record as InvoiceBlock,
  Items,
  Legal,
  Notes,
  Pagination,
  QRCode,
  Quantity,
  TaxLabel,
  TaxRate,
  Total,
  Type,
  Value,
} from '~/ui/invoice/blocks/blocks'
import { Money } from '~/ui/money'
import { Outlet } from '~/ui/outlet'
import { match } from '~/utils/match'

export function Invoice() {
  let record = useRecord()
  let info = useRecordInfo()

  return (
    <InvoiceBlock className="bg-white">
      {/* Header */}
      {/* Big heading */}
      <div className="hidden first-page:block">
        <div className="bg-gray-50 px-12 py-8">
          <CubeIcon className="h-12 text-gray-400" />

          <div className="mt-4 flex items-end justify-between">
            <span className="space-x-3 text-2xl">
              <span>
                <Type className="font-medium text-gray-500" />
                <span className="text-gray-300">.</span>
              </span>
              <span className="text-lg text-gray-300">/</span>
              <Value of="number" className="text-lg tabular-nums text-gray-500" />
            </span>

            <div className="text-right">
              <div className="space-x-3">
                <Translation
                  className="text-gray-500"
                  for={match(record.type, {
                    quote: 'dates.quoteDate',
                    invoice: 'dates.issueDate',
                    'credit-note': 'credit-note.fields.invoice',
                    receipt: 'receipt.fields.invoice',
                  })}
                />
                <span className="font-medium tabular-nums text-gray-700">
                  {match(
                    record.type,
                    {
                      quote(r: Quote) {
                        return <Date date={r.quoteDate} format="PPP" />
                      },
                      invoice(r: InvoiceType) {
                        return <Date date={r.issueDate} format="PPP" />
                      },
                      'credit-note'(r: CreditNote) {
                        return <>{r.invoice.number}</>
                      },
                      receipt(r: Receipt) {
                        return <>{r.invoice.number}</>
                      },
                    },
                    record,
                  )}
                </span>
              </div>
              <div className="space-x-3">
                <Translation
                  className="text-gray-500"
                  for={match(record.type, {
                    quote: 'dates.quoteExpirationDate',
                    invoice: 'dates.dueDate',
                    'credit-note': 'dates.creditNoteDate',
                    receipt: 'dates.receiptDate',
                  })}
                />
                <span className="font-medium tabular-nums text-gray-700">
                  {match(
                    record.type,
                    {
                      quote(r: Quote) {
                        return <Date date={r.quoteExpirationDate} format="PPP" />
                      },
                      invoice(r: InvoiceType) {
                        return <Date date={r.dueDate} format="PPP" />
                      },
                      'credit-note'(r: CreditNote) {
                        return <Date date={r.creditNoteDate} format="PPP" />
                      },
                      receipt(r: Receipt) {
                        return <Date date={r.receiptDate} format="PPP" />
                      },
                    },
                    record,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between px-12 py-8 text-gray-500">
          <div className="flex flex-col">
            <Translation className="text-sm font-medium text-gray-900" for="account.title" />
            <div className="flex flex-1 flex-col whitespace-pre-wrap text-sm font-normal">
              <div className="flex-1">
                <Value of="account.name" />
                <Address for="account" />
              </div>
              {record.account.tax && (
                <div className="mt-4">
                  <TaxLabel for="account" className="text-sm font-medium text-gray-900" />
                  <div>
                    <Classified>{record.account.tax.value}</Classified>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <Translation className="text-sm font-medium text-gray-900" for="client.title" />
            <div className="flex flex-1 flex-col whitespace-pre-wrap text-sm font-normal">
              <div className="flex-1">
                <Value of="client.name" />
                <Address for="client" />
              </div>
              {record.client.tax && (
                <div className="mt-4">
                  <TaxLabel for="client" className="text-sm font-medium text-gray-900" />
                  <div>
                    <Classified>{record.client.tax.value}</Classified>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Small Heading */}
      <div className="hidden bg-gray-50 px-12 py-8 last-page:block single-page:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CubeIcon className="h-10 text-gray-400" />

            <span className="space-x-3 text-lg">
              <span>
                <Type className="font-medium text-gray-500" />
                <span className="text-gray-300">.</span>
              </span>
              <span className="text-sm text-gray-300">/</span>
              <Value of="number" className="text-sm tabular-nums text-gray-500" />
            </span>
          </div>

          <Pagination className="text-sm text-gray-600" />
        </div>
      </div>

      {/* Contents */}
      <div className="flex-1 overflow-auto">
        <Outlet>
          <Items>
            {({ items }) => {
              return (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-full whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-900 first:pl-12">
                        <Translation for="invoiceItem.description" />
                      </th>
                      <th className="w-full whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-900">
                        <Translation for="invoiceItem.quantity" />
                      </th>
                      <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                        <Translation for="invoiceItem.unitPrice" />
                      </th>
                      {info.hasVat && (
                        <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                          <Translation for="invoiceItem.vat" />
                        </th>
                      )}
                      <th className="w-full whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 last:pr-12">
                        <Translation for="invoiceItem.subtotal" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx, all) => {
                      return (
                        <RecordItemProvider key={item.id} item={item}>
                          <tr
                            data-first={idx === 0 || undefined}
                            data-last={idx === all.length - 1 || undefined}
                            className="[--bottom:--py] [--indent:theme(spacing.8)] [--left:--px] [--px:theme(spacing.4)] [--py:theme(spacing[1.5])] [--right:--px] [--top:--py] data-[last]:[--bottom:theme(spacing.4)] data-[first]:[--top:theme(spacing.4)]"
                          >
                            <td className="whitespace-pre-wrap pb-[--bottom] pl-[calc(var(--indent)+var(--left))] pr-[--right] pt-[--top] text-left align-top text-sm font-medium text-gray-900">
                              <Description />
                              <ul className="empty:hidden">
                                {item.discounts.map((discount, idx) => {
                                  return (
                                    <li
                                      key={idx}
                                      className="whitespace-nowrap text-left text-sm font-normal text-gray-500"
                                    >
                                      <Translation for="summary.discount.title" />
                                      {discount.reason && (
                                        <>
                                          <span className="px-1">
                                            (
                                            <span className="text-xs font-medium text-gray-400">
                                              {discount.reason}
                                            </span>
                                            )
                                          </span>
                                        </>
                                      )}
                                      <span className="px-3 text-gray-400">/</span>
                                      {match(
                                        discount.type,
                                        {
                                          fixed(discount: Extract<Discount, { type: 'fixed' }>) {
                                            if (discount.quantity === 1) {
                                              return <Money amount={-1 * discount.value} />
                                            }

                                            return (
                                              <span>
                                                <Money amount={-1 * discount.value} />
                                                <span className="px-1">&times;</span>
                                                {discount.quantity}
                                              </span>
                                            )
                                          },
                                          percentage() {
                                            return <>{(-1 * (discount.value * 100)).toFixed(0)}%</>
                                          },
                                        },
                                        discount,
                                      )}
                                    </li>
                                  )
                                })}
                              </ul>
                            </td>
                            <td className="whitespace-nowrap pb-[--bottom] pl-[--left] pr-[--right] pt-[--top] text-left align-top text-sm tabular-nums text-gray-500">
                              <Quantity />
                            </td>
                            <td className="whitespace-nowrap pb-[--bottom] pl-[--left] pr-[--right] pt-[--top] text-right align-top text-sm text-gray-500">
                              <Money amount={item.unitPrice} />
                            </td>
                            {info.hasVat && (
                              <td className="whitespace-nowrap pb-[--bottom] pl-[--left] pr-[--right] pt-[--top] text-right align-top text-sm tabular-nums text-gray-500">
                                <TaxRate />
                              </td>
                            )}
                            <td className="whitespace-nowrap pb-[--bottom] pl-[--left] pr-[calc(var(--indent)+var(--right))] pt-[--top] text-right align-top text-sm font-semibold text-gray-900">
                              <Money amount={itemPrice(item)} />
                            </td>
                          </tr>
                        </RecordItemProvider>
                      )
                    })}
                    <Summary />
                  </tbody>
                </table>
              )
            }}
          </Items>
        </Outlet>
      </div>

      <div className="hidden w-full items-end justify-between px-8 pb-4 pt-1 empty:hidden last-page:flex">
        {/* Notes */}
        <Notes className="relative w-full max-w-sm space-y-1 rounded-md bg-gray-50 p-4 text-xs">
          <div className="absolute -right-3 -top-3 rounded-full bg-gray-50 p-1">
            <InformationCircleIcon className="h-6 w-6 text-gray-400" />
          </div>
          <Outlet />
        </Notes>
      </div>

      {/* Footer */}
      {/* Small footer */}
      <div className="hidden items-center justify-between bg-gray-50 px-12 py-3 text-sm text-gray-600 first-page:flex single-page:hidden">
        <Value of="account.name" />
        <Pagination />
      </div>

      {/* Big footer */}
      <div className="group hidden last-page:block">
        <div className="relative space-y-6 bg-gray-50 px-12 py-8 text-gray-900">
          <div className="grid grid-cols-[1fr,auto] gap-8">
            <div className="text-xl font-medium">
              <Translation for="summary.total" />
            </div>
            <div className="text-xl font-medium">
              <Total className="-my-2 rounded-full bg-black px-4 py-2 text-center text-white" />
            </div>
            <div className="col-span-2 flex items-start gap-8 group-has-[[data-qr-code]]:col-span-1">
              {record.account.contactFields.length > 0 && (
                <table className="text-sm">
                  <thead>
                    <tr>
                      <td colSpan={2} className="text-sm font-medium text-gray-900">
                        <Translation for="summary.contactDetails" />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {record.account.contactFields.map((field) => {
                      return (
                        <tr key={field.id}>
                          <td className="text-center">
                            <ContactFieldIcon
                              field={field}
                              className="h-4 w-4 text-gray-500 grayscale"
                            />
                          </td>
                          <td className="px-3">
                            <Classified>{field.value}</Classified>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {record.account.paymentMethods.length > 0 && (
                <table className="text-sm">
                  <thead>
                    <tr>
                      <td colSpan={2} className="text-sm font-medium text-gray-900">
                        <Translation for="summary.paymentDetails" />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {record.account.paymentMethods.map((paymentMethod) => {
                      return (
                        <tr key={paymentMethod.id}>
                          <td className="text-center">
                            {match(paymentMethod.type, {
                              iban() {
                                return <BanknotesIcon className="h-4 w-4 text-gray-500" />
                              },
                              paypal() {
                                return <PaypalIcon className="h-4 w-4 text-gray-500" />
                              },
                            })}
                          </td>
                          <td className="px-3">
                            <Classified>{paymentMethod.value}</Classified>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              {/* QR Code */}
              <QRCode
                data-qr-code
                className="relative flex items-center justify-center rounded-lg border border-gray-400 p-2 pt-3"
              >
                <span className="absolute inset-x-0 top-0 flex -translate-y-2 items-center justify-center">
                  <Translation
                    for="qr.label"
                    className="whitespace-nowrap bg-gray-50 px-1 text-xs text-gray-600"
                  />
                </span>
                <Outlet />
              </QRCode>
            </div>
          </div>
          <Legal className="w-full text-center text-xs" />
        </div>
      </div>
    </InvoiceBlock>
  )
}

export function Attachment() {
  return (
    <AttachmentBlock className="bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 px-12 py-3 text-sm text-gray-600">
        <Value of="attachment.name" />
        <Pagination />
      </div>

      {/* Contents */}
      <div className="flex-1 overflow-auto p-12">
        <Outlet className="prose prose-sm flex max-w-[calc(297mm-calc(48px*2))] flex-1 flex-col" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between bg-gray-50 px-12 py-3 text-sm text-gray-600">
        <Value of="account.name" />
        <Pagination />
      </div>
    </AttachmentBlock>
  )
}

function itemPrice(item: any) {
  let net = item.unitPrice * item.quantity
  for (let discount of item.discounts) {
    if (discount.type === 'percentage') {
      net -= net * discount.value
    } else if (discount.type === 'fixed') {
      net -= discount.value * discount.quantity
    }
  }
  return net
}

let summaryItems: {
  [P in Summary['type']]: (
    item: Extract<Summary, { type: P }>,
    ctx: { t: ReturnType<typeof useTranslation> },
  ) => [React.ReactNode, React.ReactNode]
} = {
  subtotal(item) {
    return [
      <>
        <Translation
          for={item.subtype === 'discounts' ? 'summary.discount.total' : 'summary.subtotal'}
        />
      </>,
      <>
        <Money amount={item.value} />
      </>,
    ]
  },
  total(item) {
    return [
      <>
        <Translation for="summary.total" className="font-bold" />
      </>,
      <>
        <Money className="font-bold" amount={item.value} />
      </>,
    ]
  },
  paid(item) {
    return [
      <>
        <Translation className="font-bold" for="summary.paid" />
      </>,
      <>
        <Money className="font-bold" amount={item.value} />
      </>,
    ]
  },
  vat(item) {
    return [
      <>
        <Translation
          for="summary.vat"
          interpolations={{
            rate: `${(item.rate * 100).toFixed(0)}%`,
          }}
        />
      </>,
      <>
        <Money amount={item.value} />
      </>,
    ]
  },
  discount(item) {
    return [
      <>
        <Translation for="summary.discount.title" />
        {item.discount.reason && (
          <>
            <span className="px-1">
              (<span className="text-xs font-medium text-gray-400">{item.discount.reason}</span>)
            </span>
          </>
        )}
        {item.discount.type === 'fixed' && item.discount.quantity !== 1 && (
          <span>&times; {item.discount.quantity}</span>
        )}
      </>,
      <>
        {match(
          item.discount.type,
          {
            fixed(discount: Extract<Discount, { type: 'fixed' }>) {
              return <Money amount={-1 * discount.value * discount.quantity} />
            },
            percentage() {
              return <>{(-1 * (item.discount.value * 100)).toFixed(0)}%</>
            },
          },
          item.discount,
        )}
      </>,
    ]
  },
}

function Summary() {
  let record = useRecord()
  let status = match(
    record.type,
    {
      quote() {
        return null
      },
      invoice() {
        return null
      },
      'credit-note'(r: CreditNote) {
        return r.invoice.status // TODO: Double check
      },
      receipt(r: Receipt) {
        return r.invoice.status
      },
    },
    record,
  )
  let pagination = usePaginationInfo()
  let isLastPage = pagination.current === pagination.total - 1

  let t = useTranslation()

  // Only show summary on the last page
  if (!isLastPage) return null

  let summaryInfo = summary({ items: record.items, discounts: record.discounts, status })

  return (
    <>
      <tr>
        <td></td>
        <td colSpan={4} className="pb-3 pl-4 pr-12">
          <div className="h-1 w-full rounded-full bg-gray-50 group-first-of-type:hidden"></div>
        </td>
      </tr>
      {summaryInfo.map((summaryItem, idx) => {
        // @ts-ignore
        let [label, value] = summaryItems[summaryItem.type](summaryItem, { t })
        return (
          <tr key={idx}>
            <td />
            <th
              colSpan={2}
              className="whitespace-nowrap px-4 py-1 text-left text-sm font-normal text-gray-500"
            >
              {label}
            </th>
            <td
              colSpan={2}
              className="whitespace-nowrap px-4 py-1 pl-4 pr-12 text-right align-top text-sm text-gray-500"
            >
              {value}
            </td>
          </tr>
        )
      })}

      <tr>
        <td className="py-1" />
      </tr>
    </>
  )
}
