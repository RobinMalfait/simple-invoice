import { kebab } from 'case'
import { format, type Locale } from 'date-fns'
import { dot } from '~/utils/dot'
import { match } from '~/utils/match'

type Configuration = {
  locale?: Locale
  transformations?: {
    [key: string]: (value: any) => string
  }
}

// Small custom template language, handlebars based
export function render<T>(template: string, input: T, config: Configuration = {}): string {
  let language = config.locale?.code?.slice(0, 2) ?? 'en'
  let or = new Intl.ListFormat(language, {
    style: 'long',
    type: 'disjunction',
  })

  let and = new Intl.ListFormat(language, {
    style: 'long',
    type: 'conjunction',
  })

  return template.replace(/{{\s*(.+?)\s*}}/g, (_, value) => {
    let transformations: string[] = value.split(/\s*\|\s*/g)
    let [path, arg] = transformations.shift()?.split(':') ?? []

    // @ts-expect-error Too generic, can't properly type this
    let next = dot(input, path)

    // Fallback to empty string for nullish values
    next ??= ''

    if (next instanceof Date) {
      next = format(next, arg ?? 'yyyy-MM-dd', { locale: config.locale })
    }

    if (transformations.length > 0) {
      for (let transform of transformations) {
        ;[transform, arg] = transform.split(':')
        next = match(transform, {
          lower() {
            return next.toLowerCase()
          },
          upper() {
            return next.toUpperCase()
          },
          kebab() {
            return kebab(next)
          },
          pick() {
            return next.map((x: any) => {
              // @ts-expect-error Too generic, can't properly type this
              return dot(x, arg)
            })
          },
          and() {
            return and.format(next)
          },
          or() {
            return or.format(next)
          },
          join() {
            return next.join(arg)
          },
          first() {
            return next.at(0)
          },
          last() {
            return next.at(-1)
          },

          // Transform the transformations itself to pass in the `next` value.
          ...Object.fromEntries(
            Object.entries(config.transformations ?? {}).map(([key, value]) => {
              return [
                key,
                () => {
                  return value(next)
                },
              ] as const
            }),
          ),
        })
      }
    }

    return next
  })
}
