import Archiver from 'archiver'
import { format } from 'date-fns'
import { redirect } from 'next/navigation'
import { Writable } from 'node:stream'
import puppeteer from 'puppeteer'
import { records } from '~/data'
import { config } from '~/domain/configuration/configuration'
import { languageToLocale } from '~/utils/language-to-locale'
import { render } from '~/utils/tl'

class BufferStream extends Writable {
  private chunks: Uint8Array[] = []
  private ready = false
  private readyListeners: ((buffer: Buffer) => void)[] = []

  _write(chunk: Uint8Array, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.chunks.push(chunk)
    callback()
  }

  _final(callback: (error?: Error | null) => void) {
    this.ready = true
    for (let listener of this.readyListeners.splice(0)) {
      listener(Buffer.concat(this.chunks))
    }
    callback()
  }

  buffer() {
    if (this.ready) {
      return Promise.resolve(Buffer.concat(this.chunks))
    }

    return new Promise<Buffer>((resolve) => {
      this.readyListeners.push(resolve)
    })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // TODO: Filter records by account
  let myRecords = records

  if (myRecords.length <= 0) {
    return redirect(`/`)
  }

  let baseURL = `http://${request.headers.get('host')}/{type}/{number}/raw`

  let zip = Archiver('zip')

  // Send the file to the page output.
  let bufferStream = new BufferStream()
  zip.pipe(bufferStream)

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

  let response = new Response(await bufferStream.buffer(), { status: 200 })
  response.headers.set('Content-Type', 'application/zip')
  response.headers.set(
    'Content-disposition',
    `attachment; filename=backup-${format(new Date(), 'yyyy-MM-dd')}.zip`,
  )

  return response
}

async function generatePDFs(urls: [filename: string, url: string][]) {
  let browser = await puppeteer.launch({ headless: 'new' })

  let buffers = await Promise.all(
    urls.map(async ([filename, url]) => {
      let page = await browser.newPage()

      page.setDefaultNavigationTimeout(0)

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
