import { title } from 'case'
import { addDays, addMonths, format, isWithinInterval, subMonths } from 'date-fns'
import { EventAttributes, createEvents } from 'ics'
import { NextRequest } from 'next/server'
import { load } from '~/app/(db)/actions'
import { records as allRecords, me } from '~/data'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { combineRecords, resolveRelevantRecordDate } from '~/domain/record/record'
import { total } from '~/ui/invoice/total'
import { createCurrencyFormatter } from '~/utils/currency-formatter'
import { match } from '~/utils/match'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (params.id !== me.id) {
    return new Response('Not found.', { status: 404 })
  }

  let money = createCurrencyFormatter({
    currency: me.currency,
    language: me.language,
    type: 'long',
  })
  let { classified } = (await load()).ui

  let now = new Date()
  let startRange = subMonths(now, 2)
  let endRange = addMonths(now, 3)

  let records = combineRecords(allRecords).filter((record) => {
    return isWithinInterval(resolveRelevantRecordDate(record), {
      start: startRange,
      end: endRange,
    })
  })

  let events: EventAttributes[] = records.map((record) => {
    let start = resolveRelevantRecordDate(record)
    let end = addDays(start, 1)

    return {
      title: `💸 #${record.number} [${title(record.type)}; ${title(
        match(
          record.type,
          {
            quote: (r: Quote) => r.status,
            invoice: (r: Invoice) => r.status,
            receipt: () => 'Paid',
          },
          record,
        ),
      )}]`,

      start: [start.getFullYear(), start.getMonth() + 1, start.getDate()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate()],
      description: [
        `Record: ${title(record.type)}`,
        `Status: ${title(
          match(
            record.type,
            {
              quote: (r: Quote) => r.status,
              invoice: (r: Invoice) => r.status,
              receipt: () => 'Paid',
            },
            record,
          ),
        )}`,
        '',
        `${title(record.type)}: #${record.number}`,
        `Client: ${record.client.nickname}`,
        '',
        ...match(
          record.type,
          {
            quote: (r: Quote) => [`Quote date: ${format(r.quoteDate, 'PPP')}`],
            invoice: (r: Invoice) => [
              `Issue date: ${format(r.issueDate, 'PPP')}`,
              `Due date: ${format(r.dueDate, 'PPP')}`,
            ],
            receipt: () => [],
          },
          record,
        ),
        '',
        `Total: ${
          classified
            ? money.format(total(record) / 100).replace(/\d/g, 'X')
            : money.format(total(record) / 100)
        }`,
      ].join('\n'),
      status: 'CONFIRMED',
      busyStatus: 'FREE',
      classification: 'CONFIDENTIAL',
      organizer: {
        name: me.name,
        email: me.email!,
      },
      attendees: [
        {
          name: me.name,
          email: me.email!,
          rsvp: true,
          partstat: 'ACCEPTED',
          role: 'REQ-PARTICIPANT',
        },
      ],
      categories: [record.type],
      url: `${req.nextUrl.origin}/${record.type}/${record.number}`,
      location: record.client.nickname,
      productId: 'invoice.simple/ics',
      uid: `invoice.simple.ics.record.${record.account.id}.${record.type}.${record.number}`,
    }
  })

  let { error, value } = createEvents(events)

  if (error) {
    console.log('error:', error)
    return new Response('Something went wrong.', { status: 500 })
  }

  return new Response(value, {
    status: 200,
  })
}
