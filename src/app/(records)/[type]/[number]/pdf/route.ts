import { redirect } from 'next/navigation'
import puppeteer from 'puppeteer'
import { records } from '~/data'
import { config } from '~/domain/configuration/configuration'
import { languageToLocale } from '~/utils/language-to-locale'
import { render } from '~/utils/tl'

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ type: string; number: string }> },
) {
  let params = await paramsPromise
  let query = new URL(request.url).searchParams
  let record = records.find((record) => {
    return record.type === params.type && record.number === params.number
  })
  let type = query.has('preview') ? ('preview' as const) : ('download' as const)

  if (!record) {
    return redirect(`/`)
  }

  let filenameTemplate = config()[record.type].pdf.filename
  let filename = render(filenameTemplate, record, {
    locale: languageToLocale(record.client.language),
  })

  return presentPDF(filename, await generatePDF(request.url.replace('/pdf', '/raw')), type)
}

function presentPDF(filename: string, data: Buffer, type: 'download' | 'preview') {
  let types = {
    download: 'attachment',
    preview: 'inline',
  }

  return new Response(data, {
    status: 201,
    headers: {
      'Content-Disposition': `${types[type]}; filename="${filename}"`,
      'Content-Length': Buffer.byteLength(data).toString(),
    },
  })
}

async function generatePDF(url: string) {
  let browser = await puppeteer.launch({ headless: true })
  let page = await browser.newPage()

  await page.goto(url)

  // Give the page time to load
  await page.waitForSelector('[data-pdf-state="ready"]', {
    timeout: 2 * 60 * 1000, // 2 minutes
  })
  let pdfBuffer = Buffer.from(
    await page.pdf({ printBackground: true, format: 'A4', preferCSSPageSize: true }),
  )

  await browser.close()

  return pdfBuffer
}
