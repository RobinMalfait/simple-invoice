'use client'

import { useMemo } from 'react'
import { collapse, expand, stringify } from '~/ui/document/html-split'
import { parse } from '~/ui/document/markdown-document'
import { useFittedPagination } from '~/ui/hooks/use-fitted-pagination'
import { PageProvider } from '~/ui/hooks/use-pagination-info'

export function Attachment({ value }: { value: string }) {
  let items = useMemo(() => expand(parse(value)), [value])
  let [pages, FitContent] = useFittedPagination(items)
  let [htmlCache] = useState(() => new Map<number, string>())

  return (
    <>
      {pages.map(([items, done], pageIdx) => {
        if (done && !htmlCache.has(pageIdx)) {
          htmlCache.set(pageIdx, stringify(collapse(items)))
        }

        let html = done ? htmlCache.get(pageIdx)! : stringify(collapse(items))

        return (
          <PageProvider key={pageIdx} info={{ total: pages.length, current: pageIdx }}>
            <div className="paper relative mx-auto flex flex-col overflow-hidden bg-white dark:bg-zinc-950/70 print:m-0">
              <div className="relative flex flex-1 flex-col overflow-auto p-12">
                <FitContent>
                  <div
                    dangerouslySetInnerHTML={{ __html: html }}
                    className="prose flex max-w-[calc(297mm-calc(48px*2))] flex-1 flex-col dark:prose-invert"
                  />
                </FitContent>
              </div>
            </div>
          </PageProvider>
        )
      })}
    </>
  )
}
