import { useI18N } from '~/ui/hooks/use-i18n'
import { languageToLocale } from '~/utils/language-to-locale'

export function useLocale() {
  let { language } = useI18N()
  return languageToLocale(language)
}
