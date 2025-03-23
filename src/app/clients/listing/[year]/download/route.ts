// More info: https://financien.belgium.be/nl/ondernemingen/btw/aangifte/jaarlijkse_klantenlisting

import { endOfYear, isWithinInterval, startOfYear } from 'date-fns'
import Excel from 'exceljs'
import { redirect } from 'next/navigation'
import path from 'node:path'
import { me, records } from '~/data'
import { summary } from '~/domain/invoice/summary'
import { resolveRelevantRecordDate } from '~/domain/record/record'
import { DefaultMap } from '~/utils/default-map'

function clientListingData(year: number) {
  let start = startOfYear(new Date(year, 0, 1))
  let end = endOfYear(start)

  let clients = new DefaultMap(() => ({ total: 0, vat: 0 }))
  for (let record of records) {
    // Skip quotes and receipts
    if (record.type !== 'invoice' && record.type !== 'credit-note') {
      continue
    }

    // Skip out of range
    if (!isWithinInterval(resolveRelevantRecordDate(record), { start, end })) {
      continue
    }

    // Skip b2c
    if (record.client.tax === null) {
      continue
    }

    // Skip non-Belgian clients
    if (!/^be/i.test(record.client.tax.value)) {
      continue
    }

    let totalVat = 0
    let totalIncludingVat = 0
    for (let item of summary(record)) {
      if (item.type === 'vat') {
        totalVat += item.value
      } else if (item.type === 'total') {
        totalIncludingVat += item.value
      }
    }

    let totalExcludingVat = totalIncludingVat - totalVat
    clients.get(record.client.tax.value).total += totalExcludingVat
    clients.get(record.client.tax.value).vat += totalVat
  }

  return {
    year,
    me: {
      // Remove all non-digits
      vat: me.tax?.value.replace(/[^\d]/g, ''),
      name: me.name,

      // Assumption: this includes the street number
      street: me.billing.street1,
      postcode: me.billing.postcode,
      city: me.billing.city,
      email: me.email,

      // 1. Convert +32 into 0
      // 2. Remove all non-digits
      //
      // E.g.: +32 123 45 67 89 -> 0123456789
      phone: me.phone?.replace('+32', '0').replace(/[^\d]/g, ''),
    },
    clients: Array.from(clients.entries())
      .map(([vatnumber, { total, vat }]) => {
        return [
          // Remove all non-digits
          vatnumber.replace(/[^\d]/g, ''),

          // Stored in cents, convert to euros
          {
            total: total / 100,
            vat: vat / 100,
          },
        ] as const
      })

      // We are only interested in clients with at least 250 EUR in total
      // excluding VAT.
      .filter(([, { total }]) => total > 250)

      // Sort by total excluding VAT
      .sort(([, a], [, z]) => z.total - a.total),
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ year: number }> }) {
  let { year } = await params
  if (!year) return redirect('/')

  console.time('Generating client listing')
  let data = clientListingData(year)

  let file = path.resolve(process.cwd(), 'src/domain/accounting/belgium/template.xlsx')
  let workbook = new Excel.Workbook()
  await workbook.xlsx.readFile(file)

  let worksheet = workbook.getWorksheet('Data')
  if (!worksheet) {
    console.timeEnd('Generating client listing')
    return redirect('/')
  }

  // Personal data
  worksheet.getCell('E6').value = data.me.vat
  worksheet.getCell('E7').value = data.me.name
  worksheet.getCell('E8').value = data.me.street
  worksheet.getCell('E9').value = data.me.postcode
  worksheet.getCell('E10').value = data.me.city
  worksheet.getCell('E11').value = data.me.email
  worksheet.getCell('E12').value = data.me.phone
  worksheet.getCell('E15').value = data.year

  // Client data
  let row = 29 // Start at row 29
  for (let [client, { total, vat }] of data.clients) {
    worksheet.getCell(`C${row}`).value = client
    worksheet.getCell(`D${row}`).value = Number(total.toFixed(2)) // Max 2 decimals
    worksheet.getCell(`E${row}`).value = Number(vat.toFixed(2)) // Max 2 decimals

    row++
  }

  let buffer = await workbook.xlsx.writeBuffer()
  let response = new Response(buffer, { status: 200 })
  response.headers.set('Content-Type', 'application/vnd.ms-excel')
  response.headers.set('Content-disposition', `attachment; filename=client-listing-${year}.xlsx`)
  console.timeEnd('Generating client listing')

  return response
}
