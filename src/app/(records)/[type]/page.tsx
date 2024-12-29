import { me, records } from '~/data'
import { combineRecords } from '~/domain/record/record'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { RecordList } from '~/ui/record/list'

export default async function Home({ params }: { params: Promise<{ type: string }> }) {
  let { type } = await params
  let filteredRecords = combineRecords(
    records.filter((e) => {
      return e.type === type
    }),
  )

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of records.
        language: me.language,
        currency: me.currency,
      }}
    >
      <RecordList records={filteredRecords} />
    </I18NProvider>
  )
}
