export function dedent(value: string) {
  let minIndent = Infinity
  let lines = value.trim().split('\n')
  for (let [idx, line] of lines.entries()) {
    if (line.trim() === '') continue
    if (idx === 0 && !line.startsWith(' ')) continue

    let indent = line.match(/^\s+/)?.[0].length ?? 0
    if (indent < minIndent) minIndent = indent
  }
  return lines
    .map((line, idx) => {
      if (idx === 0 && !line.startsWith(' ')) return line
      return line.slice(minIndent)
    })
    .join('\n')
}
