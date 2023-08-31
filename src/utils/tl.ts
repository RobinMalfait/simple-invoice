import { kebab } from 'case'
import { format, type Locale } from 'date-fns'
import { match } from '~/utils/match'

type Configuration = {
  locale?: Locale
  transformations?: {
    [key: string]: (value: any) => string
  }
}

// Small custom template language, handlebars based
export function render<T>(template: string, input: T, config: Configuration = {}): string {
  return template.replace(/{{(.+?)}}/g, (_, value) => {
    let transformations: string[] = value.split('|')
    let [path, arg] = transformations.shift()?.split(':') ?? []

    let segments = path.split('.')
    let next: any = input
    for (let segment of segments) {
      let current = next
      next = next[segment]
      if (!(segment in current)) {
        throw new Error(
          `Could not find property \`${segment}\` in ${Object.keys(current)
            .map((x) => `\`${x}\``)
            .join(', ')}`,
        )
      }
    }

    // Fallback to empty string for nullish values
    next ??= ''

    if (next instanceof Date) {
      next = format(next, arg ?? 'yyyy-MM-dd', { locale: config.locale })
    }

    if (transformations.length > 0) {
      for (let transform of transformations) {
        next = match(transform, {
          lower: () => next.toLowerCase(),
          upper: () => next.toUpperCase(),
          kebab: () => kebab(next),

          // Transform the transformations itself to pass in the `next` value.
          ...Object.fromEntries(
            Object.entries(config.transformations ?? {}).map(
              ([key, value]) => [key, () => value(next)] as const,
            ),
          ),
        })
      }
    }

    return next
  })
}
