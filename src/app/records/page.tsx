import { me, records } from '~/data'
import { combineRecords } from '~/domain/record/record'
import { I18NProvider } from '~/ui/hooks/use-i18n'
import { RecordList } from '~/ui/record/list'

export default async function Home() {
  let combinedRecords = combineRecords(records)

  return (
    <I18NProvider
      value={{
        // Prefer my language/currency when looking at the overview of records.
        language: me.language,
        currency: me.currency,
      }}
    >
      <RecordList records={combinedRecords} />
    </I18NProvider>
  )
}
