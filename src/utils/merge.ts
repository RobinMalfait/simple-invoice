export function merge<T>(target: T, ...sources: T[]): T {
  for (let source of sources) {
    for (let key in source) {
      if (Array.isArray(source[key])) {
        target[key] = source[key]
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        target[key] = merge(target[key] ?? ({} as T), source[key])
      } else {
        target[key] = source[key]
      }
    }
  }

  return target
}
