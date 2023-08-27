export function fuzzyMatch(needle: string, haystack: string) {
  let lastIdx = -1

  needle = needle.toLowerCase()
  haystack = haystack.toLowerCase()

  for (let c of needle) {
    if (c === ' ') continue

    let pos = haystack.indexOf(c, lastIdx + 1)
    if (pos === -1) return false

    lastIdx = pos
  }

  return true
}
