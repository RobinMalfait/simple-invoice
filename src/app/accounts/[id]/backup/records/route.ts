import Archiver from 'archiver'
import { format } from 'date-fns'
import fs from 'fs'
import { redirect } from 'next/navigation'
import { tmpdir } from 'os'
import puppeteer from 'puppeteer'
import { records } from '~/data'
import { config } from '~/domain/configuration/configuration'
import { languageToLocale } from '~/utils/language-to-locale'
import { render } from '~/utils/tl'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // TODO: Don't do this, stream directly
  let tmpFileName = `${tmpdir()}/simple-invoice-backup.zip`
  let stream = fs.createWriteStream(tmpFileName)

  // TODO: Filter records by account
  let myRecords = records

  if (myRecords.length <= 0) {
    return redirect(`/`)
  }

  let baseURL = `http://${request.headers.get('host')}/{type}/{number}/raw`

  let zip = Archiver('zip')

  // Send the file to the page output.
  zip.pipe(stream)

  for (let [file, buffer] of await generatePDFs(
    myRecords.map((record) => {
      let { filename: filenameTemplate, folder: folderTemplate } = config()[record.type].pdf
      let folder = render(folderTemplate, record, {
        locale: languageToLocale(record.client.language),
      })
      let filename = render(filenameTemplate, record, {
        locale: languageToLocale(record.client.language),
      })
      let url = baseURL.replace('{type}', record.type).replace('{number}', record.number)

      return [`${folder}/${filename}`, url] as [string, string]
    }),
  )) {
    zip.append(buffer, { name: file })
  }

  await zip.finalize()
  await new Promise((r) => setTimeout(r, 100))

  let response = new Response(fs.readFileSync(tmpFileName), { status: 200 })
  response.headers.set('Content-Type', 'application/zip')
  response.headers.set(
    'Content-disposition',
    `attachment; filename=backup-${format(new Date(), 'yyyy-MM-dd')}.zip`,
  )
  fs.unlinkSync(tmpFileName)

  return response
}

async function generatePDFs(urls: [filename: string, url: string][]) {
  let browser = await puppeteer.launch({ headless: 'new' })

  let buffers = await Promise.all(
    urls.map(async ([filename, url]) => {
      let page = await browser.newPage()

      await page.goto(url)

      // Give the page time to load
      await page.waitForSelector('[data-pdf-state="ready"]', {
        timeout: 2 * 60 * 1000, // 2 minutes
      })

      return [
        filename,
        await page.pdf({
          printBackground: true,
          format: 'A4',
          preferCSSPageSize: true,
        }),
      ] as const
    }),
  )

  await browser.close()

  return buffers
}
