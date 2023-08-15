'use client'

import { useMemo, useState } from 'react'
import { Document } from '~/domain/document/document'
import { collapse, expand, paginate, parseMarkdown, stringify } from '~/ui/document/document'
import { useFittedPagination } from '~/ui/hooks/use-fitted-pagination'
import { PageProvider, usePaginationInfo } from '~/ui/hooks/use-pagination-info'
import { useTranslation } from '~/ui/hooks/use-translation'
import { match } from '~/utils/match'
import { SmallFooter } from './small-footer'

export function Attachment({ document }: { document: Document }) {
  let items = useMemo(() => {
    return match(document.type, {
      markdown: () => expand(parseMarkdown(document.value)),
      html: () => expand(document.value),
    })
  }, [document])

  // @ts-expect-error I'll fix this later
  let [pages, FitContent, completed] = useFittedPagination(items, paginate)
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
              {!completed && (
                <div className="absolute inset-0 z-20 bg-black/10 backdrop-blur">
                  <div className="p-4 text-xl dark:text-white">
                    Computing <strong className="font-bold">{document.name}</strong>, please hold on
                    tight&hellip;
                  </div>
                </div>
              )}
              <SmallHeading name={document.name} />

              <div className="relative flex flex-1 flex-col overflow-auto p-12">
                <FitContent>
                  <div
                    dangerouslySetInnerHTML={{ __html: html }}
                    className="prose prose-sm flex max-w-[calc(297mm-calc(48px*2))] flex-1 flex-col dark:prose-invert"
                  />
                </FitContent>
              </div>

              <SmallFooter />
            </div>
          </PageProvider>
        )
      })}
    </>
  )
}

export function SmallHeading({ name }: { name: string }) {
  let { total, current } = usePaginationInfo()
  let t = useTranslation()

  return (
    <div className="flex items-center justify-between bg-gray-50 px-12 py-3 text-sm text-gray-600 dark:bg-zinc-900 dark:text-zinc-300">
      <span>{name}</span>
      <span>
        {t((x) => x.pagination.summary, {
          current: current + 1,
          total,
        })}
      </span>
    </div>
  )
}
