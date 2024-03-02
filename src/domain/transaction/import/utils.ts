import { parse as csvParse, type Options } from 'csv-parse/sync'

export function csv<T>(
  raw: string,
  transform: (record: Record<string, string>) => T,
  options?: Options,
): T[] {
  return csvParse(raw, {
    columns: true,
    delimiter: ';',
    group_columns_by_name: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    ...options,
  }).map((record: any) => {
    return transform(record)
  })
}
