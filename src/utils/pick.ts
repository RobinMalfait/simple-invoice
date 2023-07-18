export function pick<T extends Record<any, any>, R extends (keyof T)[]>(object: T, keysToPick: R) {
  let clone = {} as Pick<T, R[number]>
  for (let key of keysToPick) {
    clone[key] = object[key]
  }
  return clone
}
