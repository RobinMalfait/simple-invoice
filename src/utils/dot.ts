// Update this `Dot` type, to only list out the leafs of the object.
export type Dot<T, Key extends keyof T = keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ? `${Key}.${Dot<T[Key], Exclude<keyof T[Key], keyof Array<any>>> & string}`
    : Key
  : never

export type DotValue<T, P extends Dot<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Dot<T[Key]>
      ? DotValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never

export function dot<T>(input: T, path: Dot<T>) {
  let segments = path.split('.')
  let next: any = input
  for (let segment of segments) {
    let current = next
    next = next[segment]
    if (!(segment in current)) {
      throw new Error(
        `Could not find property \`${segment}\` in ${Object.keys(current)
          .map((x) => {
            return `\`${x}\``
          })
          .join(', ')}`,
      )
    }
  }
  return next
}
