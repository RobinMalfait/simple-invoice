export function required(value: string): never {
  let error = new Error(`Missing required value: ${value}`)
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, required)
  }
  throw error
}
