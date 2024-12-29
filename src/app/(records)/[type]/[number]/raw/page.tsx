import { redirect } from 'next/navigation'
import { records } from '~/data'
import { RecordProvider } from '~/ui/hooks/use-record'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'

export default async function Raw({
  params,
}: {
  params: Promise<{ type: string; number: string }>
}) {
  let { type, number } = await params
  let record = records.find((record) => {
    return record.type === type && record.number === number
  })

  if (!record) {
    return redirect('/')
  }

  return (
    <RecordProvider record={record}>
      <InvoicePreview />
    </RecordProvider>
  )
}
