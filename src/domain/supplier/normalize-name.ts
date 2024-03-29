// Utility to try and normalize the name. This will only be used for suggesting a new name but the
// end user will have to confirm this change.
export function normalizeName(name: string) {
  let normalized = name
    .trim()
    .toUpperCase()
    // Replace special characters with a space
    .replace(/[*,_]/g, ' ')
    .replace(/\s+/g, ' ') // Remove duplicate spaces
    // Uppercase first letter of each word
    .replace(/([-\s0-9])*([a-z])([^\s-]{3,})/gi, (_, prefix = '', firstLetter, rest) => {
      return prefix + firstLetter.toUpperCase() + rest.toLowerCase()
    })
    // Replace short abbreviations like `ABC-Foo` with `ABC Foo`
    .replace(/([A-Z]{2,3})-/g, '$1 ')
    .replace(/\s+/g, ' ') // Remove duplicate spaces
    .replace(/\(.\)/g, '') // Remove single characters in parentheses
    .replace(/\b\w*\b/g, (word) => {
      if (PREFERS_UPPERCASE.has(word.toLowerCase())) return word.toUpperCase()
      if (PREFERS_LOWERCASE.has(word.toLowerCase())) return word.toLowerCase()
      if (PREFERS_TITLE_CASE.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      }
      return word
    })
    .trim()

  // Close non-closed parentheses
  let open = 0
  for (let c of normalized) {
    if (c === '(') open++
    if (c === ')') open--
  }
  if (open > 0) {
    let lastOpenIdx = normalized.lastIndexOf('(')
    let wordIdx = normalized.indexOf(' ', lastOpenIdx)
    if (wordIdx === -1) wordIdx = normalized.length

    normalized = normalized.slice(0, wordIdx) + ')' + normalized.slice(wordIdx)
  } else if (open < 0) {
    let firstCloseIdx = normalized.indexOf(')')
    let wordIdx = normalized.lastIndexOf(' ', firstCloseIdx)
    if (wordIdx === -1) wordIdx = 0

    normalized = normalized.slice(0, wordIdx) + ' (' + normalized.slice(wordIdx).trim()
  }

  return normalized
    .replace(/\s+/g, ' ') // Remove duplicate spaces
    .replace(/\(.\)/g, '') // Remove single characters in parentheses
    .replace(/\.$/g, '') // Remove trailing dot
    .trim()
}

let PREFERS_UPPERCASE = new Set<string>([
  // Company formats, Belgium (dutch)
  'nv',
  'bv',
  'bvba', // Deprecated
  'cv',
  'vof',
  'commv',
  'vzw',
  'ivzw',
  // Company formats, Belgium (french)
  'sa',
  'srl',
  'sc',
  'snc',
  'scomm',
  'asbl',
  'aisbl',
  // Company formats, USA
  'llc',
])
let PREFERS_LOWERCASE = new Set<string>(['ikea'])
let PREFERS_TITLE_CASE = new Set<string>(['the'])
