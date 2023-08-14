'use client'

import { useMemo, useState } from 'react'
import { collapse, expand, stringify } from '~/ui/document/html-split'
import { parse } from '~/ui/document/markdown-document'
import { useFittedPagination } from '~/ui/hooks/use-fitted-pagination'
import { PageProvider, usePaginationInfo } from '~/ui/hooks/use-pagination-info'
import { useTranslation } from '~/ui/hooks/use-translation'
import { SmallFooter } from './small-footer'

export function Attachment({ name, value }: { name: string; value: string }) {
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
              <SmallHeading name={name} />

              <div className="relative flex flex-1 flex-col overflow-auto p-12">
                <FitContent>
                  <div
                    dangerouslySetInnerHTML={{ __html: html }}
                    className="prose flex max-w-[calc(297mm-calc(48px*2))] flex-1 flex-col dark:prose-invert"
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
