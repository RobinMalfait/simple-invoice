import EN_US from 'date-fns/locale/en-US'
import NL_BE from 'date-fns/locale/nl-BE'
import { Language } from '~/domain/language/language'
import { match } from '~/utils/match'

export function languageToLocale(language: Language) {
  return match(language, {
    [Language.NL]: () => {
      return NL_BE
    },
    [Language.EN]: () => {
      return EN_US
    },
  })
}
