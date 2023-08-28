import { kebab } from 'case'
import { format } from 'date-fns'
import { match } from '~/utils/match'

// Small custom template language, handlebars based
export function render<T>(template: string, input: T): string {
  return template.replace(/{{([^}]+)}}/g, (_, value) => {
    let transformations: string[] = value.split('|')
    let [path, arg] = transformations.shift()?.split(':') ?? []

    let segments = path.split('.')
    let next: any = input
    for (let segment of segments) {
      next = next[segment]
      if (next === undefined || next === null) {
        throw new Error(`Could not find property ${segment} in ${path}`)
      }
    }

    if (next instanceof Date) {
      next = format(next, arg ?? 'yyyy-MM-dd')
    }

    if (transformations.length > 0) {
      for (let transform of transformations) {
        next = match(transform, {
          lower: () => next.toLowerCase(),
          upper: () => next.toUpperCase(),
          kebab: () => kebab(next),
        })
      }
    }

    return next
  })
}
