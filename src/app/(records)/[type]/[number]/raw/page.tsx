import { redirect } from 'next/navigation'
import { records } from '~/data'
import { RecordProvider } from '~/ui/hooks/use-record'
import { Invoice as InvoicePreview } from '~/ui/invoice/design'

export default function Raw({
  params: { type, number },
}: {
  params: { type: string; number: string }
}) {
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
