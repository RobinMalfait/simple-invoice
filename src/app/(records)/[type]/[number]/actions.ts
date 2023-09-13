import { load } from '~/app/(db)/actions'
import { config } from '~/domain/configuration/configuration'
import { Contact } from '~/domain/contact/contact'
import { Record } from '~/domain/record/record'
import { parseMarkdown as _parseMarkdown } from '~/ui/document/document'
import { total } from '~/ui/invoice/total'
import { createCurrencyFormatter } from '~/utils/currency-formatter'
import { dedent } from '~/utils/dedent'
import { languageToLocale } from '~/utils/language-to-locale'
import { render } from '~/utils/tl'

function parseMarkdown(value: string) {
  let context = { nested: 0 }
  let markdown = _parseMarkdown(value)
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

    // Cleanup
    .replace(/<p><\/p>/g, '')
    .replace(/(<br>|\n)+$/g, '')
  return markdown
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
      locale: languageToLocale(record.client.language),
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

export async function loadTemplateList(record: Record) {
  let { classified } = (await load()).ui

  return config()[record.type].mail.templates.map((template) => {
    return {
      id: template.id,
      name: template.name,
      subject: dedent(renderTemplate(template.subject, record, { classified })),
    }
  })
}

type Configuration = {
  recipients: Contact['id'][]
}

export async function loadTemplate(record: Record, id: string, configuration: Configuration) {
  let { classified } = (await load()).ui

  record = Object.assign({}, record, {
    client: Object.assign({}, record.client, {
      contacts: record.client.contacts.filter((contact) =>
        configuration.recipients.includes(contact.id),
      ),
    }),
  })

  let template = config()[record.type].mail.templates.find((template) => template.id === id)
  if (!template) {
    return null
  }

  let adjustedRecord = Object.assign({}, record, {
    account: Object.assign({}, record.account, {
      legal: record.account.legal && render(record.account.legal, { account: record.account }),
    }),
  })

  let subject = dedent(renderTemplate(template.subject, adjustedRecord, { classified }))
  let body = dedent(renderTemplate(template.body ?? '', adjustedRecord, { classified }))

  return {
    id: template.id,
    name: template.name,
    subject,
    body: {
      text: body,
      html: parseMarkdown(body),
    },
  }
}
