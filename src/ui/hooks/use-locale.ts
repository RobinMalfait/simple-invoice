import EN_US from 'date-fns/locale/en-US'
import NL_BE from 'date-fns/locale/nl-BE'

import { Language } from '~/domain/language/language'
import { useI18N } from '~/ui/hooks/use-i18n'
import { match } from '~/utils/match'

export function useLocale() {
  let { language } = useI18N()
  return match(language, {
    [Language.NL]: () => NL_BE,
    [Language.EN]: () => EN_US,
  })
}
