import { redirect } from 'next/navigation'
import { invoices } from '~/data'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'

export default function Raw({ params: { number } }: { params: { number: string } }) {
  let invoice = invoices.find((invoice) => invoice.number === number)

  if (!invoice) {
    redirect('/')
  }

  return <InvoicePreview invoice={invoice} />
}
