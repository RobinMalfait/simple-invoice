export function match<T extends string | number = string, R = any>(
  value: T,
  patterns: Record<T, ((...args: any[]) => R) | R>,
  ...args: any[]
): R {
  if (value in patterns) {
    return typeof patterns[value] === 'function'
      ? (patterns[value] as any)(...args)
      : patterns[value]
  } else {
    throw new Error(
      `Tried to handle "${value}" but there is no handler defined. Only defined handlers are: ${Object.keys(
        patterns,
      )
        .map((key) => {
          return `"${key}"`
        })
        .join(', ')}.`,
    )
  }
}
