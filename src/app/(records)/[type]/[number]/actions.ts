import { load } from '~/app/(db)/actions'
import { config } from '~/domain/configuration/configuration'
import { Record } from '~/domain/record/record'
import { parseMarkdown as _parseMarkdown } from '~/ui/document/document'
import { total } from '~/ui/invoice/total'
import { createCurrencyFormatter } from '~/utils/currency-formatter'
import { dedent } from '~/utils/dedent'
import { render } from '~/utils/tl'

function parseMarkdown(value: string) {
  let context = { nested: 0 }
  return _parseMarkdown(value)
    .split('\n')
    .map((line, idx, all) => {
      let nextLine = all[idx + 1] ?? ''
      if (line.startsWith('<blockquote>')) {
        context.nested += 1
      }

      if (line.endsWith('</blockquote>')) {
        context.nested -= 1
      }

      if (line.endsWith('</p>') && !nextLine.startsWith('<ul>') && context.nested === 0) {
        line = `${line}<br>`
      }

      if (line.endsWith('</blockquote>') && context.nested === 0) {
        line = `${line}<br>`
      }

      if (line.endsWith('</ul>') && context.nested === 0) {
        line = `${line}<br>`
      }
      return line
    })
    .map((line) => line.replace(/\s{2,}/g, (spaces) => '&nbsp;'.repeat(spaces.length)))
    .join('\n')
    .trim()
    .replace(/(<br>)+$/g, '')
}

function renderTemplate(template: string, record: Record, { classified = false } = {}) {
  let money = createCurrencyFormatter({
    currency: record.client.currency,
    language: record.client.language,
    type: 'long',
  })

  return render(
    template,
    Object.assign({}, record, {
      get total() {
        return total(record)
      },
    }),
    {
      transformations: {
        money(value: number) {
          let result = money.format(value / 100)

          if (classified) {
            return `||${result.replace(/\d/g, 'X')}||`
          }

          return result
        },
      },
    },
  )
}

export async function loadTemplates(record: Record) {
  let { classified } = (await load()).ui

  return config()[record.type].mail.templates.map((template) => {
    let subject = dedent(renderTemplate(template.subject, record, { classified }))
    let body = dedent(renderTemplate(template.body ?? '', record, { classified }))

    return {
      id: template.id,
      name: template.name,
      subject,
      body: {
        text: body,
        html: parseMarkdown(body),
      },
    }
  })
}
