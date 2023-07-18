import { EyeIcon } from '@heroicons/react/24/outline'
import { redirect } from 'next/navigation'
import { invoices } from '~/data'
import { DownloadLink } from '~/ui/download-link'
import { InvoiceProvider } from '~/ui/hooks/use-invoice'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'
import { total, TotalFeatures } from '~/ui/invoice/total'
import { Money } from '~/ui/money'

export default function Invoice({ params: { number } }: { params: { number: string } }) {
  let invoice = invoices.find((invoice) => invoice.number === number)

  if (!invoice) {
    redirect('/')
  }

  return (
    <InvoiceProvider invoice={invoice}>
      <div className="[--spacing:theme(spacing.8)]">
        <div className="mx-auto flex w-full max-w-7xl flex-1 gap-[--spacing] px-4 py-[--spacing] sm:px-6 lg:px-8">
          <div className="flex flex-[calc(210mm+calc(var(--spacing)*2))] grow-0 flex-col rounded-lg border border-black/10 bg-gray-950/10">
            <div className="h-[calc(297mm+calc(var(--spacing)*2))] overflow-hidden">
              <div className="relative z-10 h-full flex-1 overflow-auto py-[--spacing]">
                <InvoicePreview invoice={invoice} />
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
              <h3 className="flex items-center justify-between text-xl">
                <span>{invoice.client.name}</span>
                <span>#{invoice.number}</span>
              </h3>
              <div className="rounded-md border border-gray-200 bg-gray-100 p-4">
                <div className="p-4 text-center text-2xl font-bold text-gray-950">
                  <Money amount={total(invoice.items, TotalFeatures.IncludingVAT)} />
                </div>
              </div>
              <div className="flex items-center justify-between text-center">
                <DownloadLink
                  className="inline-flex items-center justify-center"
                  href={`/invoices/${invoice.number}/pdf`}
                >
                  Download PDF
                </DownloadLink>
                <a
                  className="inline-flex items-center justify-center"
                  target="_blank"
                  href={`/invoices/${invoice.number}/pdf?preview`}
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  <span>Preview PDF</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InvoiceProvider>
  )
}
