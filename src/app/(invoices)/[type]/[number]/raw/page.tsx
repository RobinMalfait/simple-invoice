import { redirect } from 'next/navigation'
import { invoices } from '~/data'
import { InvoiceProvider } from '~/ui/hooks/use-invoice'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'

export default function Raw({
  params: { type, number },
}: {
  params: { type: string; number: string }
}) {
  let invoice = invoices.find((invoice) => invoice.type === type && invoice.number === number)

  if (!invoice) {
    return redirect('/')
  }

  return (
    <InvoiceProvider invoice={invoice}>
      <InvoicePreview />
    </InvoiceProvider>
  )
}
